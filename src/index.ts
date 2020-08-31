import { Parser } from './parser';
import { Lexer } from './lexer';
import { Runtime } from './runtime';
import { TreeInterpreter } from './tree-interpreter';
import * as helpers from './helpers';
import { IFunctionTable } from './types';
export * as constants from './constants';

interface SearchOptions {
  definition?: IFunctionTable;
}

export function compile(stream: string) {
  const parser = new Parser();
  return parser.parse(stream);
}

export function tokenize(stream: string) {
  const lexer = new Lexer();
  return lexer.tokenize(stream);
}

export function search(data: any, expression: string, options?: SearchOptions) {
  const parser = new Parser();
  // This needs to be improved.  Both the interpreter and runtime depend on
  // each other.  The runtime needs the interpreter to support exprefs.
  // There's likely a clean way to avoid the cyclic dependency.
  const runtime = new Runtime(options);
  const interpreter = new TreeInterpreter(runtime);
  runtime.setInterpreter(interpreter);
  const node = parser.parse(expression);
  return interpreter.search(node, data);
}

export const strictDeepEqual = helpers.strictDeepEqual;
