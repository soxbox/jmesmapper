export interface IToken {
  type: string;
  value?: any;
  start: number;
}

export interface IFunctionSignature {
  types: number[];
  variadic?: boolean;
  optional?: boolean;
}

export interface IFunctionTableType {
  _func: Function;
  _signature: IFunctionSignature[];
}

export interface IFunctionTable {
  [key: string]: IFunctionTableType;
}

export enum TokenType {
  EOF = 'EOF',
  UNQUOTEDIDENTIFIER = 'UnquotedIdentifier',
  QUOTEDIDENTIFIER = 'QuotedIdentifier',
  REGULAREXPRESSION = 'RegularExpression',
  RBRACKET = 'Rbracket',
  RPAREN = 'Rparen',
  COMMA = 'Comma',
  COLON = 'Colon',
  RBRACE = 'Rbrace',
  NUMBER = 'Number',
  CURRENT = 'Current',
  EXPREF = 'Expref',
  PIPE = 'Pipe',
  OR = 'Or',
  AND = 'And',
  EQ = 'EQ',
  GT = 'GT',
  LT = 'LT',
  GTE = 'GTE',
  LTE = 'LTE',
  NE = 'NE',
  FLATTEN = 'Flatten',
  STAR = 'Star',
  FILTER = 'Filter',
  DOT = 'Dot',
  NOT = 'Not',
  LBRACE = 'Lbrace',
  LBRACKET = 'Lbracket',
  LPAREN = 'Lparen',
  LITERAL = 'Literal',
  SCOPE = 'Scope',
}

export enum AstTypes {
  FIELD = 'Field',
  CURRENT = 'Current',
  SUB_EXPRESSION = 'Subexpression',
  INDEX_EXPRESSION = 'IndexExpression',
  NOT_EXPRESSION = 'NotExpression',
  LITERAL = 'Literal',
  IDENTITY = 'Identity',
  VALUE_PROJECTION = 'ValueProjection',
  PROJECTION = 'Projection',
  EXPRESSION_REFERENCE = 'ExpressionReference',
  OR_EXPRESSION = 'OrExpression',
  AND_EXPRESSION = 'AndExpression',
  FUNCTION = 'Function',
  FILTER_PROJECTION = 'FilterProjection',
  INDEX = 'Index',
  SLICE = 'Slice',
  COMPARATOR = 'Comparator',
  MULTI_SELECT_LIST = 'MultiSelectList',
  MULTI_SELECT_HASH = 'MultiSelectHash',
  KEY_VALUE_PAIR = 'KeyValuePair',
  FLATTEN = 'Flatten',
  PIPE = 'Pipe',
  SCOPE = 'Scope',
  REGULAREXPRESSION = 'RegularExpression',
}

export type KeyValuePairType = {
  type: AstTypes.KEY_VALUE_PAIR;
  name: string;
  value: any;
  jmespathType?: TokenType.EXPREF;
  context?: any;
};

export type IAst =
  | {
      type: AstTypes.FIELD | AstTypes.SCOPE;
      name: string;
      jmespathType?: TokenType.EXPREF;
      context?: any;
    }
  | {
      type: AstTypes.FUNCTION | AstTypes.COMPARATOR;
      name: string;
      children: Array<IAst | undefined | null>;
      jmespathType?: TokenType.EXPREF;
      context?: any;
    }
  | {
      type:
        | AstTypes.SUB_EXPRESSION
        | AstTypes.INDEX_EXPRESSION
        | AstTypes.NOT_EXPRESSION
        | AstTypes.VALUE_PROJECTION
        | AstTypes.PROJECTION
        | AstTypes.EXPRESSION_REFERENCE
        | AstTypes.OR_EXPRESSION
        | AstTypes.AND_EXPRESSION
        | AstTypes.FILTER_PROJECTION
        | AstTypes.MULTI_SELECT_LIST
        | AstTypes.FLATTEN
        | AstTypes.PIPE;
      children: Array<IAst | undefined | null>;
      jmespathType?: TokenType.EXPREF;
      context?: any;
    }
  | {
      type: AstTypes.MULTI_SELECT_HASH;
      children: KeyValuePairType[];
      jmespathType?: TokenType.EXPREF;
      context?: any;
    }
  | {
      type: AstTypes.SLICE;
      children: Array<number | null>;
      jmespathType?: TokenType.EXPREF;
      context?: any;
    }
  | {
      type: AstTypes.LITERAL | AstTypes.INDEX | AstTypes.REGULAREXPRESSION;
      value: any;
      jmespathType?: TokenType.EXPREF;
      context?: any;
    }
  | {
      type: AstTypes.IDENTITY | AstTypes.CURRENT;
      jmespathType?: TokenType.EXPREF;
      context?: any;
    }
  | KeyValuePairType;
