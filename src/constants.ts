import { TokenType } from './types';

type IStringObject = {
  [key in string | number]: string;
};

type INumberObject = {
  [key in string]: number;
};

type IBooleanObject = {
  [key in string]: boolean;
};

// Type constants used to define functions.
export const TYPE_NUMBER = 0;
export const TYPE_ANY = 1;
export const TYPE_STRING = 2;
export const TYPE_ARRAY = 3;
export const TYPE_OBJECT = 4;
export const TYPE_BOOLEAN = 5;
export const TYPE_EXPREF = 6;
export const TYPE_NULL = 7;
export const TYPE_ARRAY_NUMBER = 8;
export const TYPE_ARRAY_STRING = 9;
export const TYPE_REGEXP = 10;
export const TYPE_ARRAY_EXPREF = 11;
export const TYPE_ARRAY_OBJECT = 12;
export const TYPE_DATE = 13;
export const TYPE_NAME_TABLE: IStringObject = {
  0: 'number',
  1: 'any',
  2: 'string',
  3: 'array',
  4: 'object',
  5: 'boolean',
  6: 'expression',
  7: 'null',
  8: 'Array<number>',
  9: 'Array<string>',
  10: 'regexp',
  11: 'Array<expression>'
};

// The "&", "[", "<", ">" tokens
// are not in basicToken because
// there are two token variants
// ("&&", "[?", "<=", ">=").  This is specially handled
// below.

export const basicTokens: IStringObject = {
  '.': TokenType.DOT,
  '*': TokenType.STAR,
  ',': TokenType.COMMA,
  ':': TokenType.COLON,
  '{': TokenType.LBRACE,
  '}': TokenType.RBRACE,
  ']': TokenType.RBRACKET,
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  '@': TokenType.CURRENT,
};

export const operatorStartToken: IBooleanObject = {
  '<': true,
  '>': true,
  '=': true,
  '!': true,
};

export const skipChars: IBooleanObject = {
  ' ': true,
  '\t': true,
  '\n': true,
};

export const bindingPower: INumberObject = {
  [TokenType.EOF]: 0,
  [TokenType.UNQUOTEDIDENTIFIER]: 0,
  [TokenType.QUOTEDIDENTIFIER]: 0,
  [TokenType.SCOPE]: 0,
  [TokenType.RBRACKET]: 0,
  [TokenType.RPAREN]: 0,
  [TokenType.COMMA]: 0,
  [TokenType.RBRACE]: 0,
  [TokenType.NUMBER]: 0,
  [TokenType.CURRENT]: 0,
  [TokenType.EXPREF]: 0,
  [TokenType.PIPE]: 1,
  [TokenType.OR]: 2,
  [TokenType.AND]: 3,
  [TokenType.EQ]: 5,
  [TokenType.GT]: 5,
  [TokenType.LT]: 5,
  [TokenType.GTE]: 5,
  [TokenType.LTE]: 5,
  [TokenType.NE]: 5,
  [TokenType.FLATTEN]: 9,
  [TokenType.STAR]: 20,
  [TokenType.FILTER]: 21,
  [TokenType.DOT]: 40,
  [TokenType.NOT]: 45,
  [TokenType.LBRACE]: 50,
  [TokenType.LBRACKET]: 55,
  [TokenType.LPAREN]: 60,
};
