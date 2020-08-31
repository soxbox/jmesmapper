/* eslint-disable unicorn/prefer-includes */
/* eslint-disable no-case-declarations */
import * as constants from './constants';
import { Lexer } from './lexer';

import { IToken, IAst, AstTypes, TokenType, KeyValuePairType } from './types';

export class Parser {
  index: number = 0;
  tokens: IToken[] = [];
  parse(expression: string): IAst {
    this._loadTokens(expression);
    this.index = 0;
    const ast = this.expression(0);
    if (this._lookahead(0) !== TokenType.EOF) {
      const t = this._lookaheadToken(0);
      const error = new Error('Unexpected token type: ' + t.type + ', value: ' + t.value);
      error.name = 'ParserError';
      throw error;
    }
    return ast;
  }

  _loadTokens(expression: string) {
    const lexer = new Lexer();
    const tokens = lexer.tokenize(expression);
    tokens.push({
      type: TokenType.EOF,
      value: '',
      start: expression.length,
    });
    this.tokens = tokens;
  }

  expression(rbp: number): IAst {
    const leftToken = this._lookaheadToken(0);
    this._advance();
    let left = this.nud(leftToken);
    let currentToken = this._lookahead(0);
    while (rbp < constants.bindingPower[currentToken]) {
      this._advance();
      left = this.led(currentToken, left);
      currentToken = this._lookahead(0);
    }
    return left;
  }

  _lookahead(number: number): string {
    return this.tokens[this.index + number].type;
  }

  _lookaheadToken(number: number): IToken {
    return this.tokens[this.index + number];
  }

  _advance() {
    this.index++;
  }

  nud(token: IToken): IAst {
    switch (token.type) {
      case TokenType.LITERAL:
        return { type: AstTypes.LITERAL, value: token.value };
      case TokenType.UNQUOTEDIDENTIFIER:
        return { type: AstTypes.FIELD, name: token.value };
      case TokenType.SCOPE: {
        return { type: AstTypes.SCOPE, name: token.value };
      }
      case TokenType.REGULAREXPRESSION:
        return {
          type: AstTypes.REGULAREXPRESSION,
          value: new RegExp(token.value.expression, token.value.flags),
        };
      case TokenType.QUOTEDIDENTIFIER:
        if (this._lookahead(0) === TokenType.LPAREN) {
          throw new Error('Quoted identifier not allowed for function names.');
        }
        return { type: AstTypes.FIELD, name: token && token.value };
      case TokenType.NOT:
        return {
          type: AstTypes.NOT_EXPRESSION,
          children: [this.expression(constants.bindingPower.Not)],
        };
      case TokenType.STAR: {
        const left: IAst = { type: AstTypes.IDENTITY };
        const right: IAst | undefined =
          this._lookahead(0) === TokenType.RBRACKET
            ? // This can happen in a multiselect,
              // [a, b, *]
              { type: AstTypes.IDENTITY }
            : this._parseProjectionRHS(constants.bindingPower.Star);

        return { type: AstTypes.VALUE_PROJECTION, children: [left, right] };
      }
      case TokenType.FILTER:
        return this.led(token.type, { type: AstTypes.IDENTITY });
      case TokenType.LBRACE:
        return this._parseMultiselectHash();
      case TokenType.FLATTEN: {
        const left: IAst = {
          type: AstTypes.FLATTEN,
          children: [{ type: AstTypes.IDENTITY }],
        };
        const right = this._parseProjectionRHS(constants.bindingPower.Flatten);
        return { type: AstTypes.PROJECTION, children: [left, right] };
      }
      case TokenType.LBRACKET:
        if (this._lookahead(0) === TokenType.NUMBER || this._lookahead(0) === TokenType.COLON) {
          const right = this._parseIndexExpression();
          return this._projectIfSlice({ type: AstTypes.IDENTITY }, right);
        } else if (this._lookahead(0) === TokenType.STAR && this._lookahead(1) === TokenType.RBRACKET) {
          this._advance();
          this._advance();
          const right = this._parseProjectionRHS(constants.bindingPower.Star);
          return {
            type: AstTypes.PROJECTION,
            children: [{ type: AstTypes.IDENTITY }, right],
          };
        }
        return this._parseMultiselectList();
      case TokenType.CURRENT:
        return { type: AstTypes.CURRENT };
      case TokenType.EXPREF:
        return {
          type: AstTypes.EXPRESSION_REFERENCE,
          children: [this.expression(constants.bindingPower.Expref)],
        };
      case TokenType.LPAREN: {
        const args = [];
        while (this._lookahead(0) !== TokenType.RPAREN) {
          let expression: IAst | undefined = undefined;
          if (this._lookahead(0) === TokenType.CURRENT) {
            expression = { type: AstTypes.CURRENT };
            this._advance();
          } else {
            expression = this.expression(0);
          }
          args.push(expression);
        }
        this._match(TokenType.RPAREN);
        return args[0];
      }
      default:
        throw this._errorToken(token);
    }
  }

  led(tokenName: string, left: IAst): IAst {
    switch (tokenName) {
      case TokenType.DOT:
        const rbp = constants.bindingPower.Dot;
        if (this._lookahead(0) !== TokenType.STAR) {
          return {
            type: AstTypes.SUB_EXPRESSION,
            children: [left, this._parseDotRHS(rbp)],
          };
        }
        // Creating a projection.
        this._advance();
        return {
          type: AstTypes.VALUE_PROJECTION,
          children: [left, this._parseProjectionRHS(rbp)],
        };
      case TokenType.PIPE:
        return {
          type: AstTypes.PIPE,
          children: [left, this.expression(constants.bindingPower.Pipe)],
        };
      case TokenType.OR:
        return {
          type: AstTypes.OR_EXPRESSION,
          children: [left, this.expression(constants.bindingPower.Or)],
        };
      case TokenType.AND:
        return {
          type: AstTypes.AND_EXPRESSION,
          children: [left, this.expression(constants.bindingPower.And)],
        };
      case TokenType.LPAREN:
        // @ts-ignore
        const name = left.name;
        const args = [];
        let expression: IAst | undefined;
        while (this._lookahead(0) !== TokenType.RPAREN) {
          if (this._lookahead(0) === TokenType.CURRENT) {
            expression = { type: AstTypes.CURRENT };
            this._advance();
          } else {
            expression = this.expression(0);
          }
          if (this._lookahead(0) === TokenType.COMMA) {
            this._match(TokenType.COMMA);
          }
          args.push(expression);
        }
        this._match(TokenType.RPAREN);
        return { type: AstTypes.FUNCTION, name, children: args };
      case TokenType.FILTER:
        const condition = this.expression(0);
        this._match(TokenType.RBRACKET);
        const right: IAst | undefined =
          this._lookahead(0) === TokenType.FLATTEN
            ? { type: AstTypes.IDENTITY }
            : this._parseProjectionRHS(constants.bindingPower.Filter);
        return {
          type: AstTypes.FILTER_PROJECTION,
          children: [left, right, condition],
        };
      case TokenType.FLATTEN:
        const leftNode: IAst = { type: AstTypes.FLATTEN, children: [left] };
        const rightNode = this._parseProjectionRHS(constants.bindingPower.Flatten);
        return { type: AstTypes.PROJECTION, children: [leftNode, rightNode] };
      case TokenType.EQ:
      case TokenType.NE:
      case TokenType.GT:
      case TokenType.GTE:
      case TokenType.LT:
      case TokenType.LTE:
        return this._parseComparator(left, tokenName);
      case TokenType.LBRACKET:
        const token = this._lookaheadToken(0);
        if (token.type === TokenType.NUMBER || token.type === TokenType.COLON) {
          return this._projectIfSlice(left, this._parseIndexExpression());
        }
        this._match(TokenType.STAR);
        this._match(TokenType.RBRACKET);
        return {
          type: AstTypes.PROJECTION,
          children: [left, this._parseProjectionRHS(constants.bindingPower.Star)],
        };
      default:
        throw this._errorToken(this._lookaheadToken(0));
    }
  }

  _match(tokenType: string): void {
    if (this._lookahead(0) === tokenType) {
      this._advance();
    } else {
      const t = this._lookaheadToken(0);
      const error = new Error('Expected ' + tokenType + ', got: ' + t.type);
      error.name = 'ParserError';
      throw error;
    }
  }

  _errorToken(token: IToken): Error {
    const error = new Error('Invalid token (' + token.type + '): "' + token.value + '"');
    error.name = 'ParserError';
    return error;
  }

  _parseIndexExpression(): IAst {
    if (this._lookahead(0) === TokenType.COLON || this._lookahead(1) === TokenType.COLON) {
      return this._parseSliceExpression();
    } else {
      const node: IAst = {
        type: AstTypes.INDEX,
        value: this._lookaheadToken(0).value,
      };
      this._advance();
      this._match(TokenType.RBRACKET);
      return node;
    }
  }

  _projectIfSlice(left: IAst, right: IAst): IAst {
    const indexExpr: IAst = {
      type: AstTypes.INDEX_EXPRESSION,
      children: [left, right],
    };
    if (right.type === 'Slice') {
      return {
        type: AstTypes.PROJECTION,
        children: [indexExpr, this._parseProjectionRHS(constants.bindingPower.Star)],
      };
    } else {
      return indexExpr;
    }
  }

  _parseSliceExpression(): IAst {
    // [start:end:step] where each part is optional, as well as the last
    // colon.
    const parts = [null, null, null];
    let index = 0;
    let currentToken = this._lookahead(0);
    while (currentToken !== TokenType.RBRACKET && index < 3) {
      if (currentToken === TokenType.COLON) {
        index++;
        this._advance();
      } else if (currentToken === TokenType.NUMBER) {
        parts[index] = this._lookaheadToken(0).value;
        this._advance();
      } else {
        const t = this._lookaheadToken(0);
        const error = new Error('Syntax error, unexpected token: ' + t.value + '(' + t.type + ')');
        error.name = 'Parsererror';
        throw error;
      }
      currentToken = this._lookahead(0);
    }
    this._match(TokenType.RBRACKET);
    return {
      type: AstTypes.SLICE,
      children: parts,
    };
  }

  _parseComparator(left: IAst, comparator: string): IAst {
    const right = this.expression(constants.bindingPower[comparator]);
    return {
      type: AstTypes.COMPARATOR,
      name: comparator,
      children: [left, right],
    };
  }

  _parseDotRHS(rbp: number): IAst | undefined {
    const lookahead = this._lookahead(0);
    const exprTokens: string[] = [
      TokenType.UNQUOTEDIDENTIFIER,
      TokenType.QUOTEDIDENTIFIER,
      TokenType.SCOPE,
      TokenType.STAR,
    ];
    if (exprTokens.indexOf(lookahead) >= 0) {
      return this.expression(rbp);
    } else if (lookahead === TokenType.LBRACKET) {
      this._match(TokenType.LBRACKET);
      return this._parseMultiselectList();
    } else if (lookahead === TokenType.LBRACE) {
      this._match(TokenType.LBRACE);
      return this._parseMultiselectHash();
    }
  }

  _parseProjectionRHS(rbp: number): IAst | undefined {
    if (constants.bindingPower[this._lookahead(0)] < 10) {
      return { type: AstTypes.IDENTITY };
    } else if (this._lookahead(0) === TokenType.LBRACKET) {
      return this.expression(rbp);
    } else if (this._lookahead(0) === TokenType.FILTER) {
      return this.expression(rbp);
    } else if (this._lookahead(0) === TokenType.DOT) {
      this._match(TokenType.DOT);
      return this._parseDotRHS(rbp);
    } else {
      const t = this._lookaheadToken(0);
      const error = new Error('Syntax error, unexpected token: ' + t.value + '(' + t.type + ')');
      error.name = 'ParserError';
      throw error;
    }
  }

  _parseMultiselectList(): IAst {
    const expressions = [];
    while (this._lookahead(0) !== TokenType.RBRACKET) {
      const expression = this.expression(0);
      expressions.push(expression);
      if (this._lookahead(0) === TokenType.COMMA) {
        this._match(TokenType.COMMA);
        if (this._lookahead(0) === TokenType.RBRACKET) {
          throw new Error('Unexpected token Rbracket');
        }
      }
    }
    this._match(TokenType.RBRACKET);
    return { type: AstTypes.MULTI_SELECT_LIST, children: expressions };
  }

  _parseMultiselectHash(): IAst {
    const pairs: KeyValuePairType[] = [];
    const identifierTypes: string[] = [TokenType.UNQUOTEDIDENTIFIER, TokenType.QUOTEDIDENTIFIER];
    for (;;) {
      const keyToken = this._lookaheadToken(0);
      if (identifierTypes.indexOf(keyToken.type) < 0) {
        throw new Error('Expecting an identifier token, got: ' + keyToken.type);
      }
      const keyName = keyToken.value;
      this._advance();
      this._match(TokenType.COLON);
      const value = this.expression(0);
      const node: KeyValuePairType = {
        type: AstTypes.KEY_VALUE_PAIR,
        name: keyName,
        value,
      };
      pairs.push(node);
      if (this._lookahead(0) === TokenType.COMMA) {
        this._match(TokenType.COMMA);
      } else if (this._lookahead(0) === TokenType.RBRACE) {
        this._match(TokenType.RBRACE);
        break;
      }
    }
    return { type: AstTypes.MULTI_SELECT_HASH, children: pairs };
  }
}
