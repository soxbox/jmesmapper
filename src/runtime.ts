/* eslint-disable unicorn/prefer-includes */
import { TreeInterpreter } from './tree-interpreter';
import { FunctionScope } from './function-scope';
import * as constants from './constants';
import * as helpers from './helpers';
import { IAst, TokenType, IFunctionSignature, IFunctionTable } from './types';
import { words, upperFirst } from 'lodash';

export class Runtime {
  _interpreter?: TreeInterpreter;
  functionTable: IFunctionTable;
  dynamicFunctions: FunctionScope;

  constructor() {
    this.dynamicFunctions = new FunctionScope();
    this.functionTable = {
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
      abs: {
        _func: this._functionAbs,
        _signature: [{ types: [constants.TYPE_NUMBER] }],
      },
      avg: {
        _func: this._functionAvg,
        _signature: [{ types: [constants.TYPE_ARRAY_NUMBER] }],
      },
      ceil: {
        _func: this._functionCeil,
        _signature: [{ types: [constants.TYPE_NUMBER] }],
      },
      contains: {
        _func: this._functionContains,
        _signature: [
          { types: [constants.TYPE_STRING, constants.TYPE_ARRAY] },
          { types: [constants.TYPE_ANY] },
        ],
      },
      ends_with: {
        _func: this._functionEndsWith,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_STRING] },
        ],
      },
      floor: {
        _func: this._functionFloor,
        _signature: [{ types: [constants.TYPE_NUMBER] }],
      },
      let: {
        _func: this.functionLet,
        _signature: [
          { types: [constants.TYPE_OBJECT] },
          { types: [constants.TYPE_EXPREF] },
        ],
      },
      length: {
        _func: this._functionLength,
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
        _func: this._functionMap,
        _signature: [
          { types: [constants.TYPE_EXPREF] },
          { types: [constants.TYPE_ARRAY] },
        ],
      },
      max: {
        _func: this._functionMax,
        _signature: [
          { types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING] },
        ],
      },
      merge: {
        _func: this._functionMerge,
        _signature: [{ types: [constants.TYPE_OBJECT], variadic: true }],
      },
      case: {
        _func: this._functionCase,
        _signature: [
          {
            types: [constants.TYPE_EXPREF, constants.TYPE_ARRAY_EXPREF],
            variadic: true,
          },
        ],
      },
      if: {
        _func: this._functionIf,
        _signature: [
          { types: [constants.TYPE_ANY] },
          { types: [constants.TYPE_EXPREF] },
          { types: [constants.TYPE_EXPREF], optional: true },
        ],
      },
      define: {
        _func: this._functionDefine,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_EXPREF] },
        ],
      },
      is_defined: {
        _func: this._functionIsDefined,
        _signature: [{ types: [constants.TYPE_STRING] }],
      },
      find: {
        _func: this._functionFind,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] },
        ],
      },
      max_by: {
        _func: this._functionMaxBy,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] },
        ],
      },
      sum: {
        _func: this._functionSum,
        _signature: [{ types: [constants.TYPE_ARRAY_NUMBER] }],
      },
      starts_with: {
        _func: this._functionStartsWith,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_STRING] },
        ],
      },
      min: {
        _func: this._functionMin,
        _signature: [
          { types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING] },
        ],
      },
      min_by: {
        _func: this._functionMinBy,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] },
        ],
      },
      type: {
        _func: this._functionType,
        _signature: [{ types: [constants.TYPE_ANY] }],
      },
      trim: {
        _func: this._functionTrim,
        _signature: [{ types: [constants.TYPE_STRING] }],
      },
      upper: {
        _func: this._functionUpper,
        _signature: [{ types: [constants.TYPE_STRING] }],
      },
      lower: {
        _func: this._functionLower,
        _signature: [{ types: [constants.TYPE_STRING] }],
      },
      replace: {
        _func: this._functionReplace,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_STRING, constants.TYPE_REGEXP] },
          { types: [constants.TYPE_STRING] },
        ],
      },
      words: {
        _func: this._functionWords,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_STRING, constants.TYPE_REGEXP], optional: true },
        ]
      },
      upper_first: {
        _func: this._functionUpperFirst,
        _signature: [
          { types: [constants.TYPE_STRING] }
        ]
      },
      keys: {
        _func: this._functionKeys,
        _signature: [{ types: [constants.TYPE_OBJECT] }],
      },
      values: {
        _func: this._functionValues,
        _signature: [{ types: [constants.TYPE_OBJECT] }],
      },
      sort: {
        _func: this._functionSort,
        _signature: [
          { types: [constants.TYPE_ARRAY_STRING, constants.TYPE_ARRAY_NUMBER] },
        ],
      },
      sort_by: {
        _func: this._functionSortBy,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] },
        ],
      },
      split: {
        _func: this._functionSplit,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_STRING, constants.TYPE_REGEXP] },
        ],
      },
      group_by: {
        _func: this._functionGroupBy,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] },
        ],
      },
      join: {
        _func: this._functionJoin,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_ARRAY_STRING] },
        ],
      },
      reverse: {
        _func: this._functionReverse,
        _signature: [{ types: [constants.TYPE_STRING, constants.TYPE_ARRAY] }],
      },
      to_array: {
        _func: this._functionToArray,
        _signature: [{ types: [constants.TYPE_ANY] }],
      },
      to_string: {
        _func: this._functionToString,
        _signature: [{ types: [constants.TYPE_ANY] }],
      },
      to_number: {
        _func: this._functionToNumber,
        _signature: [{ types: [constants.TYPE_ANY] }],
      },
      not_null: {
        _func: this._functionNotNull,
        _signature: [{ types: [constants.TYPE_ANY], variadic: true }],
      },
    };
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
    return functionEntry._func.call(this, resolvedArgs);
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
  // String Functions
  _functionStartsWith(resolvedArgs: any[]): boolean {
    return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
  }

  _functionEndsWith(resolvedArgs: any[]): boolean {
    const searchStr = resolvedArgs[0];
    const suffix = resolvedArgs[1];
    return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
  }

  _functionLower(resolvedArgs: any[]): string {
    return resolvedArgs[0].toLowerCase();
  }

  _functionUpper(resolvedArgs: any[]): string {
    return resolvedArgs[0].toUpperCase();
  }

  _functionTrim(resolvedArgs: any[]): number | null {
    return resolvedArgs[0].trim();
  }

  _functionSplit(resolvedArgs: any[]): number | null {
    return resolvedArgs[0].split(resolvedArgs[1]);
  }

  _functionReplace(resolvedArgs: any[]): string {
    return resolvedArgs[0].replace(resolvedArgs[1], resolvedArgs[2]);
  }

  _functionWords(resolvedArgs: any[]): string[] {
    return words(resolvedArgs[0], resolvedArgs[1]);
  }

  _functionUpperFirst(resolvedArgs: any[]): string {
    return upperFirst(resolvedArgs[0]);
  }

  // logical functions
  _functionCase(resolvedArgs: any[]): any {
    const interpreter = this.getInterpreter();
    for (let i = 0; i < resolvedArgs.length; i++) {
      if (helpers.isArray(resolvedArgs[i])) {
        if (resolvedArgs[i].length !== 2) {
          throw new Error(
            'TypeError: expected ' +
              constants.TYPE_NAME_TABLE[constants.TYPE_ARRAY_EXPREF] +
              ' to have 2 elements For case conditions'
          );
        }
        if (interpreter.visit(resolvedArgs[i][0], resolvedArgs[i][0].context)) {
          return interpreter.visit(
            resolvedArgs[i][1],
            resolvedArgs[i][0].context
          );
        }
      } else {
        return interpreter.visit(resolvedArgs[i], resolvedArgs[i].context);
      }
    }
    return null;
  }

  _functionIf(resolvedArgs: any[]): any {
    const expression = resolvedArgs[0];
    const thenExpr = resolvedArgs[1];
    const elseExpr = resolvedArgs[2];
    const interpreter = this.getInterpreter();
    if (expression) {
      return interpreter.visit(thenExpr, thenExpr.context);
    }
    if (elseExpr) {
      return interpreter.visit(elseExpr, elseExpr.context);
    }
  }

  _functionDefine(resolvedArgs: any[]): any {
    const name = resolvedArgs[0];
    const expRef = resolvedArgs[1];
    this.dynamicFunctions.registerFunction(name, expRef);
    return expRef.context;
  }

  _functionIsDefined(resolvedArgs: any[]): boolean {
    const func = this.dynamicFunctions.getFunctionEntry(resolvedArgs[0]);
    return func !== undefined;
  }

  // collection functions
  _functionFind(resolvedArgs: any[]): any {
    const data: any[] = resolvedArgs[0];
    const exprefNode = resolvedArgs[1];
    const interpreter = this.getInterpreter();

    for(let i=1; i <= data.length; i++) {
      if (interpreter.visit(exprefNode, data[i])) {
        return data[i];
      }
    }
    return null;
  }

  _functionReverse(resolvedArgs: any[]): any[] | string {
    const typeName = this._getTypeName(resolvedArgs[0]);
    if (typeName === constants.TYPE_STRING) {
      const originalStr = resolvedArgs[0];
      let reversedStr = '';
      for (let i = originalStr.length - 1; i >= 0; i--) {
        reversedStr += originalStr[i];
      }
      return reversedStr;
    } else {
      const reversedArray = resolvedArgs[0].slice(0);
      reversedArray.reverse();
      return reversedArray;
    }
  }

  _functionAbs(resolvedArgs: any[]): number {
    return Math.abs(resolvedArgs[0]);
  }

  _functionCeil(resolvedArgs: any[]): number {
    return Math.ceil(resolvedArgs[0]);
  }

  _functionAvg(resolvedArgs: any[]): number {
    let sum = 0;
    const inputArray = resolvedArgs[0];
    for (let i = 0; i < inputArray.length; i++) {
      sum += inputArray[i];
    }
    return sum / inputArray.length;
  }

  _functionContains(resolvedArgs: any[]): boolean {
    return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
  }

  _functionFloor(resolvedArgs: any[]): number {
    return Math.floor(resolvedArgs[0]);
  }

  _functionLength(resolvedArgs: any[]): number {
    if (!helpers.isObject(resolvedArgs[0])) {
      return resolvedArgs[0].length;
    } else {
      // As far as I can tell, there's no way to get the length
      // of an object without O(n) iteration through the object.
      return Object.keys(resolvedArgs[0]).length;
    }
  }

  _functionMap(resolvedArgs: any[]): any[] {
    const mapped = [];
    const interpreter = this.getInterpreter();
    const exprefNode = resolvedArgs[0];
    const elements = resolvedArgs[1];
    for (let i = 0; i < elements.length; i++) {
      try {
        interpreter.scopeChain.pushScope({ index: i });
        mapped.push(interpreter.visit(exprefNode, elements[i]));
      } finally {
        interpreter.scopeChain.popScope();
      }
    }
    return mapped;
  }

  _functionMerge(resolvedArgs: any[]): { [key: string]: any } {
    const merged: { [key: string]: any } = {};
    for (let i = 0; i < resolvedArgs.length; i++) {
      const current = resolvedArgs[i];
      for (const key in current) {
        merged[key] = current[key];
      }
    }
    return merged;
  }

  _functionMax(resolvedArgs: any[]): number | null {
    if (resolvedArgs[0].length > 0) {
      const typeName = this._getTypeName(resolvedArgs[0][0]);
      if (typeName === constants.TYPE_NUMBER) {
        return Math.max.apply(Math, resolvedArgs[0]);
      } else {
        const elements = resolvedArgs[0];
        let maxElement = elements[0];
        for (let i = 1; i < elements.length; i++) {
          if (maxElement.localeCompare(elements[i]) < 0) {
            maxElement = elements[i];
          }
        }
        return maxElement;
      }
    } else {
      return null;
    }
  }

  _functionMin(resolvedArgs: any[]): number | null {
    if (resolvedArgs[0].length > 0) {
      const typeName = this._getTypeName(resolvedArgs[0][0]);
      if (typeName === constants.TYPE_NUMBER) {
        return Math.min.apply(Math, resolvedArgs[0]);
      } else {
        const elements = resolvedArgs[0];
        let minElement = elements[0];
        for (let i = 1; i < elements.length; i++) {
          if (elements[i].localeCompare(minElement) < 0) {
            minElement = elements[i];
          }
        }
        return minElement;
      }
    } else {
      return null;
    }
  }

  _functionSum(resolvedArgs: any[]): number {
    let sum = 0;
    const listToSum = resolvedArgs[0];
    for (let i = 0; i < listToSum.length; i++) {
      sum += listToSum[i];
    }
    return sum;
  }

  _functionType(resolvedArgs: any[]): string | undefined {
    switch (this._getTypeName(resolvedArgs[0])) {
      case constants.TYPE_NUMBER:
        return 'number';
      case constants.TYPE_STRING:
        return 'string';
      case constants.TYPE_ARRAY:
        return 'array';
      case constants.TYPE_OBJECT:
        return 'object';
      case constants.TYPE_BOOLEAN:
        return 'boolean';
      case constants.TYPE_EXPREF:
        return 'expref';
      case constants.TYPE_NULL:
        return 'null';
    }
  }

  _functionKeys(resolvedArgs: any[]): string[] {
    return Object.keys(resolvedArgs[0]);
  }

  _functionValues(resolvedArgs: any[]): any[] {
    const obj = resolvedArgs[0];
    const keys = Object.keys(obj);
    const values = [];
    for (let i = 0; i < keys.length; i++) {
      values.push(obj[keys[i]]);
    }
    return values;
  }

  _functionJoin(resolvedArgs: any[]): string {
    const joinChar = resolvedArgs[0];
    const listJoin = resolvedArgs[1];
    return listJoin.join(joinChar);
  }

  _functionToArray(resolvedArgs: any[]): any[] {
    if (this._getTypeName(resolvedArgs[0]) === constants.TYPE_ARRAY) {
      return resolvedArgs[0];
    } else {
      return [resolvedArgs[0]];
    }
  }

  _functionToString(resolvedArgs: any[]): string {
    if (this._getTypeName(resolvedArgs[0]) === constants.TYPE_STRING) {
      return resolvedArgs[0];
    } else {
      return JSON.stringify(resolvedArgs[0]);
    }
  }

  _functionToNumber(resolvedArgs: any[]): number | null {
    const typeName = this._getTypeName(resolvedArgs[0]);
    let convertedValue;
    if (typeName === constants.TYPE_NUMBER) {
      return resolvedArgs[0];
    } else if (typeName === constants.TYPE_STRING) {
      convertedValue = +resolvedArgs[0];
      if (!isNaN(convertedValue)) {
        return convertedValue;
      }
    }
    return null;
  }

  _functionNotNull(resolvedArgs: any[]): boolean | null {
    for (let i = 0; i < resolvedArgs.length; i++) {
      if (this._getTypeName(resolvedArgs[i]) !== constants.TYPE_NULL) {
        return resolvedArgs[i];
      }
    }
    return null;
  }

  _functionSort(resolvedArgs: any[]): any[] {
    const sortedArray = resolvedArgs[0].slice(0);
    sortedArray.sort();
    return sortedArray;
  }

  _functionSortBy(resolvedArgs: any[]): any[] {
    const sortedArray = resolvedArgs[0].slice(0);
    if (sortedArray.length === 0) {
      return sortedArray;
    }
    const interpreter = this.getInterpreter();
    const exprefNode = resolvedArgs[1];
    const requiredType = this._getTypeName(
      interpreter.visit(exprefNode, sortedArray[0])
    );
    if (
      // @ts-ignore
      [constants.TYPE_NUMBER, constants.TYPE_STRING].indexOf(requiredType) < 0
    ) {
      throw new Error('TypeError');
    }
    const that = this;
    // In order to get a stable sort out of an unstable
    // sort algorithm, we decorate/sort/undecorate (DSU)
    // by creating a new list of [index, element] pairs.
    // In the cmp function, if the evaluated elements are
    // equal, then the index will be used as the tiebreaker.
    // After the decorated list has been sorted, it will be
    // undecorated to extract the original elements.
    const decorated = [];
    for (let i = 0; i < sortedArray.length; i++) {
      decorated.push([i, sortedArray[i]]);
    }
    decorated.sort(function (a, b) {
      const exprA = interpreter.visit(exprefNode, a[1]);
      const exprB = interpreter.visit(exprefNode, b[1]);
      if (that._getTypeName(exprA) !== requiredType) {
        throw new Error(
          'TypeError: expected ' +
            requiredType +
            ', received ' +
            that._getTypeName(exprA)
        );
      } else if (that._getTypeName(exprB) !== requiredType) {
        throw new Error(
          'TypeError: expected ' +
            requiredType +
            ', received ' +
            that._getTypeName(exprB)
        );
      }
      if (exprA > exprB) {
        return 1;
      } else if (exprA < exprB) {
        return -1;
      } else {
        // If they're equal compare the items by their
        // order to maintain relative order of equal keys
        // (i.e. to get a stable sort).
        return a[0] - b[0];
      }
    });
    // Undecorate: extract out the original list elements.
    for (let j = 0; j < decorated.length; j++) {
      sortedArray[j] = decorated[j][1];
    }
    return sortedArray;
  }

  _functionGroupBy(resolvedArgs: any[]): any {
    const items = resolvedArgs[0].slice(0);
    if (items.length === 0) {
      return items;
    }
    const interpreter = this.getInterpreter();
    const exprefNode = resolvedArgs[1];
    const requiredType = this._getTypeName(
      interpreter.visit(exprefNode, items[0])
    );
    if (
      // @ts-ignore
      [constants.TYPE_NUMBER, constants.TYPE_STRING].indexOf(requiredType) < 0
    ) {
      throw new Error('TypeError');
    }

    return items.reduce(
      (out: { [key: string]: any }, item: { [key: string]: any }) => {
        const value = interpreter.visit(exprefNode, item);
        if (!Object.prototype.hasOwnProperty.call(out, value)) {
          out[value] = [];
        }
        out[value].push(item);
        return out;
      },
      {}
    );
  }

  _functionMaxBy(resolvedArgs: any[]): any {
    const exprefNode = resolvedArgs[1];
    const resolvedArray = resolvedArgs[0];
    const keyFunction = this.createKeyFunction(exprefNode, [
      constants.TYPE_NUMBER,
      constants.TYPE_STRING,
    ]);
    let maxNumber = -Infinity;
    let maxRecord;
    for (let i = 0; i < resolvedArray.length; i++) {
      const current = keyFunction(resolvedArray[i]);
      if (current > maxNumber) {
        maxNumber = current;
        maxRecord = resolvedArray[i];
      }
    }
    return maxRecord;
  }

  _functionMinBy(resolvedArgs: any[]): any {
    const exprefNode = resolvedArgs[1];
    const resolvedArray = resolvedArgs[0];
    const keyFunction = this.createKeyFunction(exprefNode, [
      constants.TYPE_NUMBER,
      constants.TYPE_STRING,
    ]);
    let minNumber = Infinity;
    let minRecord;
    for (let i = 0; i < resolvedArray.length; i++) {
      const current = keyFunction(resolvedArray[i]);
      if (current < minNumber) {
        minNumber = current;
        minRecord = resolvedArray[i];
      }
    }
    return minRecord;
  }

  functionLet(resolvedArgs: IAst[]) {
    var scope = resolvedArgs[0];
    var exprefNode = resolvedArgs[1];
    var interpreter = this.getInterpreter();
    if (exprefNode.jmespathType !== 'Expref') {
      throw new Error(
        'TypeError: expected ExpreRef, received ' + exprefNode.type
      );
    }
    interpreter.scopeChain.pushScope(scope);
    try {
      return interpreter.visit(exprefNode, exprefNode.context);
    } finally {
      interpreter.scopeChain.popScope();
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
