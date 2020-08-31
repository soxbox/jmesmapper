/* eslint-disable unicorn/prefer-includes */
import * as constants from './constants';
import * as helpers from './helpers';

import { IToken, TokenType } from './types';

export class Lexer {
  _current: number = 0;
  public tokenize(stream: string): IToken[] {
    const tokens: IToken[] = [];
    this._current = 0;
    let start;
    let identifier;
    let token;
    while (this._current < stream.length) {
      if (helpers.isAlpha(stream[this._current])) {
        start = this._current;
        identifier = this._consumeUnquotedIdentifier(stream);
        tokens.push({
          type: TokenType.UNQUOTEDIDENTIFIER,
          value: identifier,
          start,
        });
      } else if (constants.basicTokens[stream[this._current]] !== undefined) {
        tokens.push({
          type: constants.basicTokens[stream[this._current]],
          value: stream[this._current],
          start: this._current,
        });
        this._current++;
      } else if (helpers.isNum(stream[this._current])) {
        token = this._consumeNumber(stream);
        tokens.push(token);
      } else if (stream[this._current] === '/') {
        tokens.push(this._consumeForwardSlash(stream));
      } else if (stream[this._current] === '$') {
        tokens.push(this._consumeScope(stream));
      } else if (stream[this._current] === '[') {
        // No need to increment this._current.  This happens
        // in _consumeLBracket
        token = this._consumeLBracket(stream);
        tokens.push(token);
      } else if (stream[this._current] === '"') {
        start = this._current;
        identifier = this._consumeQuotedIdentifier(stream);
        tokens.push({
          type: TokenType.QUOTEDIDENTIFIER,
          value: identifier,
          start,
        });
      } else if (stream[this._current] === "'") {
        start = this._current;
        identifier = this._consumeRawStringLiteral(stream);
        tokens.push({
          type: TokenType.LITERAL,
          value: identifier,
          start,
        });
      } else if (stream[this._current] === '`') {
        start = this._current;
        const literal = this._consumeLiteral(stream);
        tokens.push({
          type: TokenType.LITERAL,
          value: literal,
          start,
        });
      } else if (constants.operatorStartToken[stream[this._current]] !== undefined) {
        const token = this._consumeOperator(stream);
        if (token) {
          tokens.push(token);
        }
      } else if (constants.skipChars[stream[this._current]] !== undefined) {
        // Ignore whitespace.
        this._current++;
      } else if (stream[this._current] === '&') {
        start = this._current;
        this._current++;
        if (stream[this._current] === '&') {
          this._current++;
          tokens.push({ type: TokenType.AND, value: '&&', start });
        } else {
          tokens.push({ type: TokenType.EXPREF, value: '&', start });
        }
      } else if (stream[this._current] === '|') {
        start = this._current;
        this._current++;
        if (stream[this._current] === '|') {
          this._current++;
          tokens.push({ type: TokenType.OR, value: '||', start });
        } else {
          tokens.push({ type: TokenType.PIPE, value: '|', start });
        }
      } else {
        const error = new Error('Unknown character:' + stream[this._current]);
        error.name = 'LexerError';
        throw error;
      }
    }
    return tokens;
  }

  private _consumeUnquotedIdentifier(stream: string): string {
    const start = this._current;
    this._current++;
    while (this._current < stream.length && helpers.isAlphaNum(stream[this._current])) {
      this._current++;
    }
    return stream.slice(start, this._current);
  }

  private _consumeForwardSlash(stream: string): IToken {
    const start = this._current;
    const maxLength = stream.length;
    this._current++;
    let expression = '';
    let flags;
    console.log(stream);
    while (stream[this._current] !== '/' && this._current < maxLength) {
      expression += stream[this._current];
      if (stream[this._current] === '\\' && stream[this._current + 1] === '/') {
        this._current++;
        expression += stream[this._current];
      }
      this._current++;
    }
    this._current++;
    if (helpers.isAlpha(stream[this._current])) {
      flags = this._consumeUnquotedIdentifier(stream);
    }
    return {
      start,
      type: TokenType.REGULAREXPRESSION,
      value: {
        expression,
        flags,
      },
    };
  }

  private _consumeScope(stream: string): IToken {
    const start = this._current;
    this._current++;
    let value;
    if (helpers.isAlpha(stream[this._current])) {
      value = this._consumeUnquotedIdentifier(stream);
    } else if (stream[this._current] === '"') {
      value = this._consumeQuotedIdentifier(stream);
    } else {
      const error = new Error('Unknown character:' + stream[this._current]);
      error.name = 'LexerError';
      throw error;
    }
    return { type: TokenType.SCOPE, value, start };
  }

  private _consumeQuotedIdentifier(stream: string): string {
    const start = this._current;
    this._current++;
    const maxLength = stream.length;
    while (stream[this._current] !== '"' && this._current < maxLength) {
      // You can escape a double quote and you can escape an escape.
      let current = this._current;
      if (stream[current] === '\\' && (stream[current + 1] === '\\' || stream[current + 1] === '"')) {
        current += 2;
      } else {
        current++;
      }
      this._current = current;
    }
    this._current++;
    return JSON.parse(stream.slice(start, this._current));
  }

  private _consumeRawStringLiteral(stream: string): string {
    const start = this._current;
    this._current++;
    const maxLength = stream.length;
    while (stream[this._current] !== "'" && this._current < maxLength) {
      // You can escape a single quote and you can escape an escape.
      let current = this._current;
      if (stream[current] === '\\' && (stream[current + 1] === '\\' || stream[current + 1] === "'")) {
        current += 2;
      } else {
        current++;
      }
      this._current = current;
    }
    this._current++;
    const literal = stream.slice(start + 1, this._current - 1);
    return literal.replace("\\'", "'");
  }

  private _consumeNumber(stream: string): IToken {
    const start = this._current;
    this._current++;
    const maxLength = stream.length;
    while (helpers.isNum(stream[this._current]) && this._current < maxLength) {
      this._current++;
    }
    const value = parseInt(stream.slice(start, this._current));
    return { type: TokenType.NUMBER, value, start };
  }

  private _consumeLBracket(stream: string): IToken {
    const start = this._current;
    this._current++;
    if (stream[this._current] === '?') {
      this._current++;
      return { type: TokenType.FILTER, value: '[?', start };
    } else if (stream[this._current] === ']') {
      this._current++;
      return { type: TokenType.FLATTEN, value: '[]', start };
    } else {
      return { type: TokenType.LBRACKET, value: '[', start };
    }
  }

  private _consumeOperator(stream: string): IToken | undefined {
    const start = this._current;
    const startingChar = stream[start];
    this._current++;
    if (startingChar === '!') {
      if (stream[this._current] === '=') {
        this._current++;
        return { type: TokenType.NE, value: '!=', start };
      } else {
        return { type: TokenType.NOT, value: '!', start };
      }
    } else if (startingChar === '<') {
      if (stream[this._current] === '=') {
        this._current++;
        return { type: TokenType.LTE, value: '<=', start };
      } else {
        return { type: TokenType.LT, value: '<', start };
      }
    } else if (startingChar === '>') {
      if (stream[this._current] === '=') {
        this._current++;
        return { type: TokenType.GTE, value: '>=', start };
      } else {
        return { type: TokenType.GT, value: '>', start };
      }
    } else if (startingChar === '=') {
      if (stream[this._current] === '=') {
        this._current++;
        return { type: TokenType.EQ, value: '==', start };
      }
    }
  }

  private _consumeLiteral(stream: string): any {
    this._current++;
    const start = this._current;
    const maxLength = stream.length;
    let literal;
    while (stream[this._current] !== '`' && this._current < maxLength) {
      // You can escape a literal char or you can escape the escape.
      let current = this._current;
      if (stream[current] === '\\' && (stream[current + 1] === '\\' || stream[current + 1] === '`')) {
        current += 2;
      } else {
        current++;
      }
      this._current = current;
    }
    let literalString = helpers.trimLeft(stream.slice(start, this._current));
    literalString = literalString.replace('\\`', '`');
    if (this._looksLikeJSON(literalString)) {
      literal = JSON.parse(literalString);
    } else {
      // Try to JSON parse it as "<literal>"
      literal = JSON.parse('"' + literalString + '"');
    }
    // +1 gets us to the ending "`", +1 to move on to the next char.
    this._current++;
    return literal;
  }

  private _looksLikeJSON(literalString: string): boolean {
    const startingChars = '[{"';
    const jsonLiterals = ['true', 'false', 'null'];
    const numberLooking = '-0123456789';

    if (literalString === '') {
      return false;
    } else if (startingChars.indexOf(literalString[0]) >= 0) {
      return true;
    } else if (jsonLiterals.indexOf(literalString) >= 0) {
      return true;
    } else if (numberLooking.indexOf(literalString[0]) >= 0) {
      try {
        JSON.parse(literalString);
        return true;
      } catch (ex) {
        return false;
      }
    } else {
      return false;
    }
  }
}
