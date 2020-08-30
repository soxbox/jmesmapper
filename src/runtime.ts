/* eslint-disable unicorn/prefer-includes */
import { TreeInterpreter } from './tree-interpreter';
import { FunctionScope } from './function-scope';
import * as constants from './constants';
import * as helpers from './helpers';
import * as mathFunctions from './functions/math-functions';
import * as numberFunctions from './functions/number-functions';
import * as arrayFunctions from './functions/array-functions';
import * as stringFunctions from './functions/string-functions';
import * as objectFunctions from './functions/object-functions';
import * as typeFunctions from './functions/type-functions';
import * as conditionalFunctions from './functions/conditional-functions';
import { IAst, TokenType, IFunctionSignature, IFunctionTable } from './types';

export class Runtime {
  _interpreter?: TreeInterpreter;
  functionTable: IFunctionTable;
  dynamicFunctions: FunctionScope;

  constructor() {
    this.dynamicFunctions = new FunctionScope();
    this.functionTable = Object.assign(
      {},
      {
        // name: [function, <signature>]
        // The <signature> can be:
        //
        // {
        //   args: [[type1, type2], [type1, type2]],
        //   variadic: true|false
        // }
        //
        // Each arg in the arg list is a list of valid types
        // (if the function is overloaded and supports multiple
        // types.  If the type is "any" then no type checking
        // occurs on the argument.  Variadic is optional
        // and if not provided is assumed to be false.
        let: {
          _func: conditionalFunctions.letFunction,
          _signature: [
            { types: [constants.TYPE_OBJECT] },
            { types: [constants.TYPE_EXPREF] },
          ],
        },
        length: {
          _func: arrayFunctions.length,
          _signature: [
            {
              types: [
                constants.TYPE_STRING,
                constants.TYPE_ARRAY,
                constants.TYPE_OBJECT,
              ],
            },
          ],
        },
        map: {
          _func: arrayFunctions.map,
          _signature: [
            { types: [constants.TYPE_EXPREF] },
            { types: [constants.TYPE_ARRAY] },
          ],
        },
        max: {
          _func: numberFunctions.max,
          _signature: [
            {
              types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING],
            },
          ],
        },
        merge: {
          _func: objectFunctions.merge,
          _signature: [{ types: [constants.TYPE_OBJECT], variadic: true }],
        },
        case: {
          _func: conditionalFunctions.caseFunction,
          _signature: [
            {
              types: [constants.TYPE_EXPREF, constants.TYPE_ARRAY_EXPREF],
              variadic: true,
            },
          ],
        },
        if: {
          _func: conditionalFunctions.ifFunction,
          _signature: [
            { types: [constants.TYPE_ANY] },
            { types: [constants.TYPE_EXPREF] },
            { types: [constants.TYPE_EXPREF], optional: true },
          ],
        },
        define: {
          _func: conditionalFunctions.define,
          _signature: [
            { types: [constants.TYPE_STRING] },
            { types: [constants.TYPE_EXPREF] },
          ],
        },
        is_defined: {
          _func: conditionalFunctions.isDefined,
          _signature: [{ types: [constants.TYPE_STRING] }],
        },
        find: {
          _func: arrayFunctions.find,
          _signature: [
            { types: [constants.TYPE_ARRAY] },
            { types: [constants.TYPE_EXPREF] },
          ],
        },
        to_entries: {
          _func: objectFunctions.toEntires,
          _signature: [{ types: [constants.TYPE_OBJECT] }],
        },
        from_entries: {
          _func: objectFunctions.fromEntires,
          _signature: [{ types: [constants.TYPE_ARRAY_OBJECT] }],
        },
        max_by: {
          _func: arrayFunctions.maxBy,
          _signature: [
            { types: [constants.TYPE_ARRAY] },
            { types: [constants.TYPE_EXPREF] },
          ],
        },
        min: {
          _func: numberFunctions.min,
          _signature: [
            {
              types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING],
            },
          ],
        },
        min_by: {
          _func: arrayFunctions.minBy,
          _signature: [
            { types: [constants.TYPE_ARRAY] },
            { types: [constants.TYPE_EXPREF] },
          ],
        },
        type: {
          _func: typeFunctions.type,
          _signature: [{ types: [constants.TYPE_ANY] }],
        },
        keys: {
          _func: objectFunctions.keys,
          _signature: [{ types: [constants.TYPE_OBJECT] }],
        },
        values: {
          _func: objectFunctions.values,
          _signature: [{ types: [constants.TYPE_OBJECT] }],
        },
        sort: {
          _func: arrayFunctions.sort,
          _signature: [
            {
              types: [constants.TYPE_ARRAY_STRING, constants.TYPE_ARRAY_NUMBER],
            },
          ],
        },
        sort_by: {
          _func: arrayFunctions.sortBy,
          _signature: [
            { types: [constants.TYPE_ARRAY] },
            { types: [constants.TYPE_EXPREF] },
          ],
        },
        group_by: {
          _func: arrayFunctions.groupBy,
          _signature: [
            { types: [constants.TYPE_ARRAY] },
            { types: [constants.TYPE_EXPREF] },
          ],
        },
        join: {
          _func: arrayFunctions.join,
          _signature: [
            { types: [constants.TYPE_STRING] },
            { types: [constants.TYPE_ARRAY_STRING] },
          ],
        },
        reverse: {
          _func: arrayFunctions.reverse,
          _signature: [
            { types: [constants.TYPE_STRING, constants.TYPE_ARRAY] },
          ],
        },
        to_array: {
          _func: arrayFunctions.toArray,
          _signature: [{ types: [constants.TYPE_ANY] }],
        },
        to_number: {
          _func: numberFunctions.toNumber,
          _signature: [{ types: [constants.TYPE_ANY] }],
        },
        not_null: {
          _func: typeFunctions.notNull,
          _signature: [{ types: [constants.TYPE_ANY], variadic: true }],
        },
      },
      stringFunctions.definition,
      mathFunctions.definition
    );
  }

  setInterpreter(interpreter: TreeInterpreter) {
    this._interpreter = interpreter;
  }

  getInterpreter(): TreeInterpreter {
    if (!this._interpreter) {
      throw new Error('Interpreter is not initialized');
    }
    return this._interpreter;
  }

  callFunction(name: string, resolvedArgs: any[]) {
    let functionEntry = this.functionTable[name];
    if (functionEntry === undefined) {
      functionEntry = this.dynamicFunctions.getFunctionEntry(name);
    }
    if (functionEntry === undefined) {
      throw new Error('Unknown function: ' + name + '()');
    }
    this._validateArgs(name, resolvedArgs, functionEntry._signature);
    return functionEntry._func.call(this, this, resolvedArgs);
  }

  _validateArgs(name: string, args: any[], signature: IFunctionSignature[]) {
    // Validating the args requires validating
    // the correct arity and the correct type of each arg.
    // If the last argument is declared as variadic, then we need
    // a minimum number of args to be required.  Otherwise it has to
    // be an exact amount.
    let pluralized;
    if (signature[signature.length - 1].variadic) {
      if (args.length < signature.length) {
        pluralized = signature.length === 1 ? ' argument' : ' arguments';
        throw new Error(
          'ArgumentError: ' +
            name +
            '() ' +
            'takes at least' +
            signature.length +
            pluralized +
            ' but received ' +
            args.length
        );
      }
    } else if (signature[signature.length - 1].optional) {
      if (args.length < signature.length - 1) {
        pluralized = signature.length === 1 ? ' argument' : ' arguments';
        throw new Error(
          'ArgumentError: ' +
            name +
            '() ' +
            'takes at least' +
            (signature.length - 1) +
            pluralized +
            ' but received ' +
            args.length
        );
      }
    } else if (args.length !== signature.length) {
      pluralized = signature.length === 1 ? ' argument' : ' arguments';
      throw new Error(
        'ArgumentError: ' +
          name +
          '() ' +
          'takes ' +
          signature.length +
          pluralized +
          ' but received ' +
          args.length
      );
    }
    for (let i = 0; i < signature.length; i++) {
      let typeMatched = false;
      const currentSpec = signature[i].types;
      const actualType = this._getTypeName(args[i]);
      for (let j = 0; j < currentSpec.length; j++) {
        if (this._typeMatches(actualType, currentSpec[j], args[i])) {
          typeMatched = true;
          break;
        }
      }
      // supports one optional type at the end of the arguments
      if (
        typeMatched == false &&
        signature[i].optional &&
        i === signature.length - 1
      ) {
        if (signature.length > args.length) {
          typeMatched = true;
        }
      }
      if (!typeMatched) {
        const expected = currentSpec
          .map(function (typeIdentifier) {
            return constants.TYPE_NAME_TABLE[typeIdentifier];
          })
          .join(',');
        throw new Error(
          'TypeError: ' +
            name +
            '() ' +
            'expected argument ' +
            (i + 1) +
            ' to be type ' +
            expected +
            ' but received type ' +
            (actualType !== undefined &&
              constants.TYPE_NAME_TABLE[actualType]) +
            ' instead.'
        );
      }
    }
  }

  _typeMatches(
    actual: number | undefined,
    expected: number | undefined,
    argValue: any
  ): boolean {
    if (expected === constants.TYPE_ANY) {
      return true;
    }
    if (
      expected === constants.TYPE_ARRAY_STRING ||
      expected === constants.TYPE_ARRAY_NUMBER ||
      expected === constants.TYPE_ARRAY_EXPREF ||
      expected === constants.TYPE_ARRAY_OBJECT ||
      expected === constants.TYPE_ARRAY
    ) {
      // The expected type can either just be array,
      // or it can require a specific subtype (array of numbers).
      //
      // The simplest case is if "array" with no subtype is specified.
      if (expected === constants.TYPE_ARRAY) {
        return actual === constants.TYPE_ARRAY;
      } else if (actual === constants.TYPE_ARRAY) {
        // Otherwise we need to check subtypes.
        // I think this has potential to be improved.
        let subtype;
        if (expected === constants.TYPE_ARRAY_NUMBER) {
          subtype = constants.TYPE_NUMBER;
        } else if (expected === constants.TYPE_ARRAY_STRING) {
          subtype = constants.TYPE_STRING;
        } else if (expected === constants.TYPE_ARRAY_EXPREF) {
          subtype = constants.TYPE_EXPREF;
        } else if (expected === constants.TYPE_ARRAY_OBJECT) {
          subtype = constants.TYPE_OBJECT;
        }
        for (let i = 0; i < argValue.length; i++) {
          if (
            !this._typeMatches(
              this._getTypeName(argValue[i]),
              subtype,
              argValue[i]
            )
          ) {
            return false;
          }
        }
        return true;
      }
    }
    return actual === expected;
  }

  _getTypeName(obj: any): number | undefined {
    switch (Object.prototype.toString.call(obj)) {
      case '[object String]':
        return constants.TYPE_STRING;
      case '[object Number]':
        return constants.TYPE_NUMBER;
      case '[object Array]':
        return constants.TYPE_ARRAY;
      case '[object Boolean]':
        return constants.TYPE_BOOLEAN;
      case '[object Null]':
        return constants.TYPE_NULL;
      case '[object RegExp]':
        return constants.TYPE_REGEXP;
      case '[object Object]':
        // Check if it's an expref.  If it has, it's been
        // tagged with a jmespathType attr of 'Expref';
        if (obj.jmespathType === TokenType.EXPREF) {
          return constants.TYPE_EXPREF;
        } else {
          return constants.TYPE_OBJECT;
        }
    }
  }

  createKeyFunction(exprefNode: IAst, allowedTypes: Array<number | undefined>) {
    const that = this;
    const interpreter = this.getInterpreter();
    const keyFunc = function (x: any) {
      const current = interpreter.visit(exprefNode, x);
      const type = that._getTypeName(current);
      if (allowedTypes.indexOf(type) < 0) {
        const msg =
          'TypeError: expected one of ' + allowedTypes + ', received ' + type;
        throw new Error(msg);
      }
      return current;
    };
    return keyFunc;
  }
}
