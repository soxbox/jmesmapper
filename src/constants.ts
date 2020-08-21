type IStringObject = {
  [key in string | number]: string
}

type INumberObject = {
  [key in string]: number
}

type IBooleanObject = {
  [key in string]: boolean
}

// Type constants used to define functions.
export const TYPE_NUMBER = 0
export const TYPE_ANY = 1
export const TYPE_STRING = 2
export const TYPE_ARRAY = 3
export const TYPE_OBJECT = 4
export const TYPE_BOOLEAN = 5
export const TYPE_EXPREF = 6
export const TYPE_NULL = 7
export const TYPE_ARRAY_NUMBER = 8
export const TYPE_ARRAY_STRING = 9
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
  9: 'Array<string>'
}

export const TOK_EOF = 'EOF'
export const TOK_UNQUOTEDIDENTIFIER = 'UnquotedIdentifier'
export const TOK_QUOTEDIDENTIFIER = 'QuotedIdentifier'
export const TOK_RBRACKET = 'Rbracket'
export const TOK_RPAREN = 'Rparen'
export const TOK_COMMA = 'Comma'
export const TOK_COLON = 'Colon'
export const TOK_RBRACE = 'Rbrace'
export const TOK_NUMBER = 'Number'
export const TOK_CURRENT = 'Current'
export const TOK_EXPREF = 'Expref'
export const TOK_PIPE = 'Pipe'
export const TOK_OR = 'Or'
export const TOK_AND = 'And'
export const TOK_EQ = 'EQ'
export const TOK_GT = 'GT'
export const TOK_LT = 'LT'
export const TOK_GTE = 'GTE'
export const TOK_LTE = 'LTE'
export const TOK_NE = 'NE'
export const TOK_FLATTEN = 'Flatten'
export const TOK_STAR = 'Star'
export const TOK_FILTER = 'Filter'
export const TOK_DOT = 'Dot'
export const TOK_NOT = 'Not'
export const TOK_LBRACE = 'Lbrace'
export const TOK_LBRACKET = 'Lbracket'
export const TOK_LPAREN = 'Lparen'
export const TOK_LITERAL = 'Literal'

// The "&", "[", "<", ">" tokens
// are not in basicToken because
// there are two token variants
// ("&&", "[?", "<=", ">=").  This is specially handled
// below.

export const basicTokens: IStringObject = {
  '.': TOK_DOT,
  '*': TOK_STAR,
  ',': TOK_COMMA,
  ':': TOK_COLON,
  '{': TOK_LBRACE,
  '}': TOK_RBRACE,
  ']': TOK_RBRACKET,
  '(': TOK_LPAREN,
  ')': TOK_RPAREN,
  '@': TOK_CURRENT
}

export const operatorStartToken: IBooleanObject = {
  '<': true,
  '>': true,
  '=': true,
  '!': true
}

export const skipChars: IBooleanObject = {
  ' ': true,
  '\t': true,
  '\n': true
}

export const bindingPower: INumberObject = {
  [TOK_EOF]: 0,
  [TOK_UNQUOTEDIDENTIFIER]: 0,
  [TOK_QUOTEDIDENTIFIER]: 0,
  [TOK_RBRACKET]: 0,
  [TOK_RPAREN]: 0,
  [TOK_COMMA]: 0,
  [TOK_RBRACE]: 0,
  [TOK_NUMBER]: 0,
  [TOK_CURRENT]: 0,
  [TOK_EXPREF]: 0,
  [TOK_PIPE]: 1,
  [TOK_OR]: 2,
  [TOK_AND]: 3,
  [TOK_EQ]: 5,
  [TOK_GT]: 5,
  [TOK_LT]: 5,
  [TOK_GTE]: 5,
  [TOK_LTE]: 5,
  [TOK_NE]: 5,
  [TOK_FLATTEN]: 9,
  [TOK_STAR]: 20,
  [TOK_FILTER]: 21,
  [TOK_DOT]: 40,
  [TOK_NOT]: 45,
  [TOK_LBRACE]: 50,
  [TOK_LBRACKET]: 55,
  [TOK_LPAREN]: 60
}
