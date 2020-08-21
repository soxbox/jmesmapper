/* eslint-disable unicorn/prefer-includes */
/* eslint-disable no-case-declarations */
import * as constants from './constants'
import { Lexer } from './lexer'

import { IToken, IAst } from './types'

export class Parser {
  index: number = 0
  tokens: IToken[] = []
  parse(expression: string): IAst {
    this._loadTokens(expression)
    this.index = 0
    const ast = this.expression(0)
    if (this._lookahead(0) !== constants.TOK_EOF) {
      const t = this._lookaheadToken(0)
      const error = new Error(
        'Unexpected token type: ' + t.type + ', value: ' + t.value
      )
      error.name = 'ParserError'
      throw error
    }
    return ast
  }

  _loadTokens(expression: string) {
    const lexer = new Lexer()
    const tokens = lexer.tokenize(expression)
    tokens.push({
      type: constants.TOK_EOF,
      value: '',
      start: expression.length
    })
    this.tokens = tokens
  }

  expression(rbp: number): IAst {
    const leftToken = this._lookaheadToken(0)
    this._advance()
    let left = this.nud(leftToken)
    let currentToken = this._lookahead(0)
    while (rbp < constants.bindingPower[currentToken]) {
      this._advance()
      left = this.led(currentToken, left)
      currentToken = this._lookahead(0)
    }
    return left
  }

  _lookahead(number: number): string {
    return this.tokens[this.index + number].type
  }

  _lookaheadToken(number: number): IToken {
    return this.tokens[this.index + number]
  }

  _advance() {
    this.index++
  }

  nud(token: IToken): IAst {
    let left
    let right
    let expression
    switch (token.type) {
      case constants.TOK_LITERAL:
        return { type: 'Literal', value: token.value }
      case constants.TOK_UNQUOTEDIDENTIFIER:
        return { type: 'Field', name: token.value }
      case constants.TOK_QUOTEDIDENTIFIER:
        if (this._lookahead(0) === constants.TOK_LPAREN) {
          throw new Error('Quoted identifier not allowed for function names.')
        }
        return { type: 'Field', name: token && token.value }
      case constants.TOK_NOT:
        right = this.expression(constants.bindingPower.Not)
        return { type: 'NotExpression', children: [right] }
      case constants.TOK_STAR:
        left = { type: 'Identity' }
        right = null
        if (this._lookahead(0) === constants.TOK_RBRACKET) {
          // This can happen in a multiselect,
          // [a, b, *]
          right = { type: 'Identity' }
        } else {
          right = this._parseProjectionRHS(constants.bindingPower.Star)
        }
        return { type: 'ValueProjection', children: [left, right] }
      case constants.TOK_FILTER:
        return this.led(token.type, { type: 'Identity' })
      case constants.TOK_LBRACE:
        return this._parseMultiselectHash()
      case constants.TOK_FLATTEN:
        left = { type: constants.TOK_FLATTEN, children: [{ type: 'Identity' }] }
        right = this._parseProjectionRHS(constants.bindingPower.Flatten)
        return { type: 'Projection', children: [left, right] }
      case constants.TOK_LBRACKET:
        if (
          this._lookahead(0) === constants.TOK_NUMBER ||
          this._lookahead(0) === constants.TOK_COLON
        ) {
          right = this._parseIndexExpression()
          return this._projectIfSlice({ type: 'Identity' }, right)
        } else if (
          this._lookahead(0) === constants.TOK_STAR &&
          this._lookahead(1) === constants.TOK_RBRACKET
        ) {
          this._advance()
          this._advance()
          right = this._parseProjectionRHS(constants.bindingPower.Star)
          return { type: 'Projection', children: [{ type: 'Identity' }, right] }
        }
        return this._parseMultiselectList()
      case constants.TOK_CURRENT:
        return { type: constants.TOK_CURRENT }
      case constants.TOK_EXPREF:
        expression = this.expression(constants.bindingPower.Expref)
        return { type: 'ExpressionReference', children: [expression] }
      case constants.TOK_LPAREN:
        const args = []
        while (this._lookahead(0) !== constants.TOK_RPAREN) {
          if (this._lookahead(0) === constants.TOK_CURRENT) {
            expression = { type: constants.TOK_CURRENT }
            this._advance()
          } else {
            expression = this.expression(0)
          }
          args.push(expression)
        }
        this._match(constants.TOK_RPAREN)
        return args[0]
      default:
        throw this._errorToken(token)
    }
  }

  led(tokenName: string, left: IAst): IAst {
    let right
    switch (tokenName) {
      case constants.TOK_DOT:
        const rbp = constants.bindingPower.Dot
        if (this._lookahead(0) !== constants.TOK_STAR) {
          right = this._parseDotRHS(rbp)
          return { type: 'Subexpression', children: [left, right] }
        }
        // Creating a projection.
        this._advance()
        right = this._parseProjectionRHS(rbp)
        return { type: 'ValueProjection', children: [left, right] }
      case constants.TOK_PIPE:
        right = this.expression(constants.bindingPower.Pipe)
        return { type: constants.TOK_PIPE, children: [left, right] }
      case constants.TOK_OR:
        right = this.expression(constants.bindingPower.Or)
        return { type: 'OrExpression', children: [left, right] }
      case constants.TOK_AND:
        right = this.expression(constants.bindingPower.And)
        return { type: 'AndExpression', children: [left, right] }
      case constants.TOK_LPAREN:
        const name = left.name
        const args = []
        let expression
        while (this._lookahead(0) !== constants.TOK_RPAREN) {
          if (this._lookahead(0) === constants.TOK_CURRENT) {
            expression = { type: constants.TOK_CURRENT }
            this._advance()
          } else {
            expression = this.expression(0)
          }
          if (this._lookahead(0) === constants.TOK_COMMA) {
            this._match(constants.TOK_COMMA)
          }
          args.push(expression)
        }
        this._match(constants.TOK_RPAREN)
        return { type: 'Function', name, children: args }
      case constants.TOK_FILTER:
        const condition = this.expression(0)
        this._match(constants.TOK_RBRACKET)
        if (this._lookahead(0) === constants.TOK_FLATTEN) {
          right = { type: 'Identity' }
        } else {
          right = this._parseProjectionRHS(constants.bindingPower.Filter)
        }
        return { type: 'FilterProjection', children: [left, right, condition] }
      case constants.TOK_FLATTEN:
        const leftNode = { type: constants.TOK_FLATTEN, children: [left] }
        const rightNode = this._parseProjectionRHS(
          constants.bindingPower.Flatten
        )
        return { type: 'Projection', children: [leftNode, rightNode] }
      case constants.TOK_EQ:
      case constants.TOK_NE:
      case constants.TOK_GT:
      case constants.TOK_GTE:
      case constants.TOK_LT:
      case constants.TOK_LTE:
        return this._parseComparator(left, tokenName)
      case constants.TOK_LBRACKET:
        const token = this._lookaheadToken(0)
        if (
          token.type === constants.TOK_NUMBER ||
          token.type === constants.TOK_COLON
        ) {
          right = this._parseIndexExpression()
          return this._projectIfSlice(left, right)
        }
        this._match(constants.TOK_STAR)
        this._match(constants.TOK_RBRACKET)
        right = this._parseProjectionRHS(constants.bindingPower.Star)
        return { type: 'Projection', children: [left, right] }
      default:
        throw this._errorToken(this._lookaheadToken(0))
    }
  }

  _match(tokenType: string): void {
    if (this._lookahead(0) === tokenType) {
      this._advance()
    } else {
      const t = this._lookaheadToken(0)
      const error = new Error('Expected ' + tokenType + ', got: ' + t.type)
      error.name = 'ParserError'
      throw error
    }
  }

  _errorToken(token: IToken): Error {
    const error = new Error(
      'Invalid token (' + token.type + '): "' + token.value + '"'
    )
    error.name = 'ParserError'
    return error
  }

  _parseIndexExpression(): IAst {
    if (
      this._lookahead(0) === constants.TOK_COLON ||
      this._lookahead(1) === constants.TOK_COLON
    ) {
      return this._parseSliceExpression()
    } else {
      const node = {
        type: 'Index',
        value: this._lookaheadToken(0).value
      }
      this._advance()
      this._match(constants.TOK_RBRACKET)
      return node
    }
  }

  _projectIfSlice(left: IAst, right: IAst): IAst {
    const indexExpr = { type: 'IndexExpression', children: [left, right] }
    if (right.type === 'Slice') {
      return {
        type: 'Projection',
        children: [
          indexExpr,
          this._parseProjectionRHS(constants.bindingPower.Star)
        ]
      }
    } else {
      return indexExpr
    }
  }

  _parseSliceExpression(): IAst {
    // [start:end:step] where each part is optional, as well as the last
    // colon.
    const parts = [null, null, null]
    let index = 0
    let currentToken = this._lookahead(0)
    while (currentToken !== constants.TOK_RBRACKET && index < 3) {
      if (currentToken === constants.TOK_COLON) {
        index++
        this._advance()
      } else if (currentToken === constants.TOK_NUMBER) {
        parts[index] = this._lookaheadToken(0).value
        this._advance()
      } else {
        const t = this._lookaheadToken(0)
        const error = new Error(
          'Syntax error, unexpected token: ' + t.value + '(' + t.type + ')'
        )
        error.name = 'Parsererror'
        throw error
      }
      currentToken = this._lookahead(0)
    }
    this._match(constants.TOK_RBRACKET)
    return {
      type: 'Slice',
      children: parts
    }
  }

  _parseComparator(left: IAst, comparator: string): IAst {
    const right = this.expression(constants.bindingPower[comparator])
    return { type: 'Comparator', name: comparator, children: [left, right] }
  }

  _parseDotRHS(rbp: number): IAst | undefined {
    const lookahead = this._lookahead(0)
    const exprTokens = [
      constants.TOK_UNQUOTEDIDENTIFIER,
      constants.TOK_QUOTEDIDENTIFIER,
      constants.TOK_STAR
    ]
    if (exprTokens.indexOf(lookahead) >= 0) {
      return this.expression(rbp)
    } else if (lookahead === constants.TOK_LBRACKET) {
      this._match(constants.TOK_LBRACKET)
      return this._parseMultiselectList()
    } else if (lookahead === constants.TOK_LBRACE) {
      this._match(constants.TOK_LBRACE)
      return this._parseMultiselectHash()
    }
  }

  _parseProjectionRHS(rbp: number): IAst | undefined {
    if (constants.bindingPower[this._lookahead(0)] < 10) {
      return { type: 'Identity' }
    } else if (this._lookahead(0) === constants.TOK_LBRACKET) {
      return this.expression(rbp)
    } else if (this._lookahead(0) === constants.TOK_FILTER) {
      return this.expression(rbp)
    } else if (this._lookahead(0) === constants.TOK_DOT) {
      this._match(constants.TOK_DOT)
      return this._parseDotRHS(rbp)
    } else {
      const t = this._lookaheadToken(0)
      const error = new Error(
        'Syntax error, unexpected token: ' + t.value + '(' + t.type + ')'
      )
      error.name = 'ParserError'
      throw error
    }
  }

  _parseMultiselectList(): IAst {
    const expressions = []
    while (this._lookahead(0) !== constants.TOK_RBRACKET) {
      const expression = this.expression(0)
      expressions.push(expression)
      if (this._lookahead(0) === constants.TOK_COMMA) {
        this._match(constants.TOK_COMMA)
        if (this._lookahead(0) === constants.TOK_RBRACKET) {
          throw new Error('Unexpected token Rbracket')
        }
      }
    }
    this._match(constants.TOK_RBRACKET)
    return { type: 'MultiSelectList', children: expressions }
  }

  _parseMultiselectHash(): IAst {
    const pairs = []
    const identifierTypes = [
      constants.TOK_UNQUOTEDIDENTIFIER,
      constants.TOK_QUOTEDIDENTIFIER
    ]
    let keyToken, keyName, value, node
    for (;;) {
      keyToken = this._lookaheadToken(0)
      if (identifierTypes.indexOf(keyToken.type) < 0) {
        throw new Error('Expecting an identifier token, got: ' + keyToken.type)
      }
      keyName = keyToken.value
      this._advance()
      this._match(constants.TOK_COLON)
      value = this.expression(0)
      node = { type: 'KeyValuePair', name: keyName, value }
      pairs.push(node)
      if (this._lookahead(0) === constants.TOK_COMMA) {
        this._match(constants.TOK_COMMA)
      } else if (this._lookahead(0) === constants.TOK_RBRACE) {
        this._match(constants.TOK_RBRACE)
        break
      }
    }
    return { type: 'MultiSelectHash', children: pairs }
  }
}
