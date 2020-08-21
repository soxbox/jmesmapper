import { Parser } from './parser'
import { Lexer } from './lexer'
import { Runtime } from './runtime'
import { TreeInterpreter } from './tree-interpreter'
import * as helpers from './helpers'

function compile(stream: string) {
  const parser = new Parser()
  return parser.parse(stream)
}

function tokenize(stream: string) {
  const lexer = new Lexer()
  return lexer.tokenize(stream)
}

function search(data: any, expression: string) {
  const parser = new Parser()
  // This needs to be improved.  Both the interpreter and runtime depend on
  // each other.  The runtime needs the interpreter to support exprefs.
  // There's likely a clean way to avoid the cyclic dependency.
  const runtime = new Runtime()
  const interpreter = new TreeInterpreter(runtime)
  runtime.setInterpreter(interpreter)
  const node = parser.parse(expression)
  return interpreter.search(node, data)
}

exports.tokenize = tokenize
exports.compile = compile
exports.search = search
exports.strictDeepEqual = helpers.strictDeepEqual
