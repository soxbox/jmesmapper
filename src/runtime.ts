/* eslint-disable unicorn/prefer-includes */
import { TreeInterpreter } from './tree-interpreter';
import { FunctionScope } from './function-scope';
import * as constants from './constants';
import * as mathFunctions from './functions/math-functions';
import * as numberFunctions from './functions/number-functions';
import * as arrayFunctions from './functions/array-functions';
import * as stringFunctions from './functions/string-functions';
import * as objectFunctions from './functions/object-functions';
import * as typeFunctions from './functions/type-functions';
import * as dateFunctions from './functions/date-functions';
import * as conditionalFunctions from './functions/conditional-functions';
import { IAst, TokenType, IFunctionSignature, IFunctionTable } from './types';

interface IRuntimeOptions {
  definition?: IFunctionTable;
}

export class Runtime {
  _interpreter?: TreeInterpreter;
  functionTable: IFunctionTable;
  dynamicFunctions: FunctionScope;

  constructor(options: IRuntimeOptions = {}) {
    this.dynamicFunctions = new FunctionScope();
    this.functionTable = Object.assign(
      {},
      stringFunctions.definition,
      mathFunctions.definition,
      arrayFunctions.definition,
      objectFunctions.definition,
      typeFunctions.definition,
      dateFunctions.definition,
      conditionalFunctions.definition,
      numberFunctions.definition,
      options.definition,
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
    if (signature.length > 0 && signature[signature.length - 1].variadic) {
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
            args.length,
        );
      }
    } else if (signature.length > 0 && signature[signature.length - 1].optional) {
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
            args.length,
        );
      }
    } else if (args.length !== signature.length) {
      pluralized = signature.length === 1 ? ' argument' : ' arguments';
      throw new Error(
        'ArgumentError: ' + name + '() ' + 'takes ' + signature.length + pluralized + ' but received ' + args.length,
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
      if (typeMatched === false && signature[i].optional && i === signature.length - 1) {
        if (signature.length > args.length) {
          typeMatched = true;
        }
      }
      if (!typeMatched) {
        const expected = currentSpec
          .map((typeIdentifier) => {
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
            (actualType !== undefined && constants.TYPE_NAME_TABLE[actualType]) +
            ' instead.',
        );
      }
    }
  }

  _typeMatches(actual: number | undefined, expected: number | undefined, argValue: any): boolean {
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
          if (!this._typeMatches(this._getTypeName(argValue[i]), subtype, argValue[i])) {
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
      case '[object Date]':
        return constants.TYPE_DATE;
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
    const interpreter = this.getInterpreter();
    const keyFunc = (x: any) => {
      const current = interpreter.visit(exprefNode, x);
      const type = this._getTypeName(current);
      if (allowedTypes.indexOf(type) < 0) {
        const msg = 'TypeError: expected one of ' + allowedTypes + ', received ' + type;
        throw new Error(msg);
      }
      return current;
    };
    return keyFunc;
  }
}
