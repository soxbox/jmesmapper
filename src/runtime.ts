/* eslint-disable unicorn/prefer-includes */
import { TreeInterpreter } from './tree-interpreter'
import * as constants from './constants'
import * as helpers from './helpers'

export class Runtime {
  _interpreter?: TreeInterpreter
  functionTable: Object
  constructor() {
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
        _signature: [{ types: [constants.TYPE_NUMBER] }]
      },
      avg: {
        _func: this._functionAvg,
        _signature: [{ types: [constants.TYPE_ARRAY_NUMBER] }]
      },
      ceil: {
        _func: this._functionCeil,
        _signature: [{ types: [constants.TYPE_NUMBER] }]
      },
      contains: {
        _func: this._functionContains,
        _signature: [
          { types: [constants.TYPE_STRING, constants.TYPE_ARRAY] },
          { types: [constants.TYPE_ANY] }
        ]
      },
      ends_with: {
        _func: this._functionEndsWith,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_STRING] }
        ]
      },
      floor: {
        _func: this._functionFloor,
        _signature: [{ types: [constants.TYPE_NUMBER] }]
      },
      length: {
        _func: this._functionLength,
        _signature: [
          {
            types: [
              constants.TYPE_STRING,
              constants.TYPE_ARRAY,
              constants.TYPE_OBJECT
            ]
          }
        ]
      },
      map: {
        _func: this._functionMap,
        _signature: [
          { types: [constants.TYPE_EXPREF] },
          { types: [constants.TYPE_ARRAY] }
        ]
      },
      max: {
        _func: this._functionMax,
        _signature: [
          { types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING] }
        ]
      },
      merge: {
        _func: this._functionMerge,
        _signature: [{ types: [constants.TYPE_OBJECT], variadic: true }]
      },
      max_by: {
        _func: this._functionMaxBy,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] }
        ]
      },
      sum: {
        _func: this._functionSum,
        _signature: [{ types: [constants.TYPE_ARRAY_NUMBER] }]
      },
      starts_with: {
        _func: this._functionStartsWith,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_STRING] }
        ]
      },
      min: {
        _func: this._functionMin,
        _signature: [
          { types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING] }
        ]
      },
      min_by: {
        _func: this._functionMinBy,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] }
        ]
      },
      type: {
        _func: this._functionType,
        _signature: [{ types: [constants.TYPE_ANY] }]
      },
      keys: {
        _func: this._functionKeys,
        _signature: [{ types: [constants.TYPE_OBJECT] }]
      },
      values: {
        _func: this._functionValues,
        _signature: [{ types: [constants.TYPE_OBJECT] }]
      },
      sort: {
        _func: this._functionSort,
        _signature: [
          { types: [constants.TYPE_ARRAY_STRING, constants.TYPE_ARRAY_NUMBER] }
        ]
      },
      sort_by: {
        _func: this._functionSortBy,
        _signature: [
          { types: [constants.TYPE_ARRAY] },
          { types: [constants.TYPE_EXPREF] }
        ]
      },
      join: {
        _func: this._functionJoin,
        _signature: [
          { types: [constants.TYPE_STRING] },
          { types: [constants.TYPE_ARRAY_STRING] }
        ]
      },
      reverse: {
        _func: this._functionReverse,
        _signature: [{ types: [constants.TYPE_STRING, constants.TYPE_ARRAY] }]
      },
      to_array: {
        _func: this._functionToArray,
        _signature: [{ types: [constants.TYPE_ANY] }]
      },
      to_string: {
        _func: this._functionToString,
        _signature: [{ types: [constants.TYPE_ANY] }]
      },
      to_number: {
        _func: this._functionToNumber,
        _signature: [{ types: [constants.TYPE_ANY] }]
      },
      not_null: {
        _func: this._functionNotNull,
        _signature: [{ types: [constants.TYPE_ANY], variadic: true }]
      }
    }
  }

  setInterpreter(interpreter: TreeInterpreter) {
    this._interpreter = interpreter
  }

  getInterpreter(): TreeInterpreter {
    if (!this._interpreter) {
      throw new Error('Interpreter is not initialized')
    }
    return this._interpreter
  }

  callFunction(name: string, resolvedArgs) {
    const functionEntry = this.functionTable[name]
    if (functionEntry === undefined) {
      throw new Error('Unknown function: ' + name + '()')
    }
    this._validateArgs(name, resolvedArgs, functionEntry._signature)
    return functionEntry._func.call(this, resolvedArgs)
  }

  _validateArgs(name, args, signature) {
    // Validating the args requires validating
    // the correct arity and the correct type of each arg.
    // If the last argument is declared as variadic, then we need
    // a minimum number of args to be required.  Otherwise it has to
    // be an exact amount.
    let pluralized
    if (signature[signature.length - 1].variadic) {
      if (args.length < signature.length) {
        pluralized = signature.length === 1 ? ' argument' : ' arguments'
        throw new Error(
          'ArgumentError: ' +
            name +
            '() ' +
            'takes at least' +
            signature.length +
            pluralized +
            ' but received ' +
            args.length
        )
      }
    } else if (args.length !== signature.length) {
      pluralized = signature.length === 1 ? ' argument' : ' arguments'
      throw new Error(
        'ArgumentError: ' +
          name +
          '() ' +
          'takes ' +
          signature.length +
          pluralized +
          ' but received ' +
          args.length
      )
    }
    let currentSpec
    let actualType
    let typeMatched
    for (let i = 0; i < signature.length; i++) {
      typeMatched = false
      currentSpec = signature[i].types
      actualType = this._getTypeName(args[i])
      for (let j = 0; j < currentSpec.length; j++) {
        if (this._typeMatches(actualType, currentSpec[j], args[i])) {
          typeMatched = true
          break
        }
      }
      if (!typeMatched) {
        const expected = currentSpec
          .map(function(typeIdentifier) {
            return constants.TYPE_NAME_TABLE[typeIdentifier]
          })
          .join(',')
        throw new Error(
          'TypeError: ' +
            name +
            '() ' +
            'expected argument ' +
            (i + 1) +
            ' to be type ' +
            expected +
            ' but received type ' +
            constants.TYPE_NAME_TABLE[actualType] +
            ' instead.'
        )
      }
    }
  }

  _typeMatches(actual, expected, argValue) {
    if (expected === constants.TYPE_ANY) {
      return true
    }
    if (
      expected === constants.TYPE_ARRAY_STRING ||
      expected === constants.TYPE_ARRAY_NUMBER ||
      expected === constants.TYPE_ARRAY
    ) {
      // The expected type can either just be array,
      // or it can require a specific subtype (array of numbers).
      //
      // The simplest case is if "array" with no subtype is specified.
      if (expected === constants.TYPE_ARRAY) {
        return actual === constants.TYPE_ARRAY
      } else if (actual === constants.TYPE_ARRAY) {
        // Otherwise we need to check subtypes.
        // I think this has potential to be improved.
        let subtype
        if (expected === constants.TYPE_ARRAY_NUMBER) {
          subtype = constants.TYPE_NUMBER
        } else if (expected === constants.TYPE_ARRAY_STRING) {
          subtype = constants.TYPE_STRING
        }
        for (let i = 0; i < argValue.length; i++) {
          if (
            !this._typeMatches(
              this._getTypeName(argValue[i]),
              subtype,
              argValue[i]
            )
          ) {
            return false
          }
        }
        return true
      }
    } else {
      return actual === expected
    }
  }

  _getTypeName(obj) {
    switch (Object.prototype.toString.call(obj)) {
      case '[object String]':
        return constants.TYPE_STRING
      case '[object Number]':
        return constants.TYPE_NUMBER
      case '[object Array]':
        return constants.TYPE_ARRAY
      case '[object Boolean]':
        return constants.TYPE_BOOLEAN
      case '[object Null]':
        return constants.TYPE_NULL
      case '[object Object]':
        // Check if it's an expref.  If it has, it's been
        // tagged with a jmespathType attr of 'Expref';
        if (obj.jmespathType === constants.TOK_EXPREF) {
          return constants.TYPE_EXPREF
        } else {
          return constants.TYPE_OBJECT
        }
    }
  }

  _functionStartsWith(resolvedArgs) {
    return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0
  }

  _functionEndsWith(resolvedArgs) {
    const searchStr = resolvedArgs[0]
    const suffix = resolvedArgs[1]
    return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1
  }

  _functionReverse(resolvedArgs) {
    const typeName = this._getTypeName(resolvedArgs[0])
    if (typeName === constants.TYPE_STRING) {
      const originalStr = resolvedArgs[0]
      let reversedStr = ''
      for (let i = originalStr.length - 1; i >= 0; i--) {
        reversedStr += originalStr[i]
      }
      return reversedStr
    } else {
      const reversedArray = resolvedArgs[0].slice(0)
      reversedArray.reverse()
      return reversedArray
    }
  }

  _functionAbs(resolvedArgs) {
    return Math.abs(resolvedArgs[0])
  }

  _functionCeil(resolvedArgs) {
    return Math.ceil(resolvedArgs[0])
  }

  _functionAvg(resolvedArgs) {
    let sum = 0
    const inputArray = resolvedArgs[0]
    for (let i = 0; i < inputArray.length; i++) {
      sum += inputArray[i]
    }
    return sum / inputArray.length
  }

  _functionContains(resolvedArgs) {
    return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0
  }

  _functionFloor(resolvedArgs) {
    return Math.floor(resolvedArgs[0])
  }

  _functionLength(resolvedArgs) {
    if (!helpers.isObject(resolvedArgs[0])) {
      return resolvedArgs[0].length
    } else {
      // As far as I can tell, there's no way to get the length
      // of an object without O(n) iteration through the object.
      return Object.keys(resolvedArgs[0]).length
    }
  }

  _functionMap(resolvedArgs) {
    const mapped = []
    const interpreter = this.getInterpreter()
    const exprefNode = resolvedArgs[0]
    const elements = resolvedArgs[1]
    for (let i = 0; i < elements.length; i++) {
      mapped.push(interpreter.visit(exprefNode, elements[i]))
    }
    return mapped
  }

  _functionMerge(resolvedArgs) {
    const merged = {}
    for (let i = 0; i < resolvedArgs.length; i++) {
      const current = resolvedArgs[i]
      for (const key in current) {
        merged[key] = current[key]
      }
    }
    return merged
  }

  _functionMax(resolvedArgs) {
    if (resolvedArgs[0].length > 0) {
      const typeName = this._getTypeName(resolvedArgs[0][0])
      if (typeName === constants.TYPE_NUMBER) {
        return Math.max.apply(Math, resolvedArgs[0])
      } else {
        const elements = resolvedArgs[0]
        let maxElement = elements[0]
        for (let i = 1; i < elements.length; i++) {
          if (maxElement.localeCompare(elements[i]) < 0) {
            maxElement = elements[i]
          }
        }
        return maxElement
      }
    } else {
      return null
    }
  }

  _functionMin(resolvedArgs) {
    if (resolvedArgs[0].length > 0) {
      const typeName = this._getTypeName(resolvedArgs[0][0])
      if (typeName === constants.TYPE_NUMBER) {
        return Math.min.apply(Math, resolvedArgs[0])
      } else {
        const elements = resolvedArgs[0]
        let minElement = elements[0]
        for (let i = 1; i < elements.length; i++) {
          if (elements[i].localeCompare(minElement) < 0) {
            minElement = elements[i]
          }
        }
        return minElement
      }
    } else {
      return null
    }
  }

  _functionSum(resolvedArgs) {
    let sum = 0
    const listToSum = resolvedArgs[0]
    for (let i = 0; i < listToSum.length; i++) {
      sum += listToSum[i]
    }
    return sum
  }

  _functionType(resolvedArgs) {
    switch (this._getTypeName(resolvedArgs[0])) {
      case constants.TYPE_NUMBER:
        return 'number'
      case constants.TYPE_STRING:
        return 'string'
      case constants.TYPE_ARRAY:
        return 'array'
      case constants.TYPE_OBJECT:
        return 'object'
      case constants.TYPE_BOOLEAN:
        return 'boolean'
      case constants.TYPE_EXPREF:
        return 'expref'
      case constants.TYPE_NULL:
        return 'null'
    }
  }

  _functionKeys(resolvedArgs) {
    return Object.keys(resolvedArgs[0])
  }

  _functionValues(resolvedArgs) {
    const obj = resolvedArgs[0]
    const keys = Object.keys(obj)
    const values = []
    for (let i = 0; i < keys.length; i++) {
      values.push(obj[keys[i]])
    }
    return values
  }

  _functionJoin(resolvedArgs) {
    const joinChar = resolvedArgs[0]
    const listJoin = resolvedArgs[1]
    return listJoin.join(joinChar)
  }

  _functionToArray(resolvedArgs) {
    if (this._getTypeName(resolvedArgs[0]) === constants.TYPE_ARRAY) {
      return resolvedArgs[0]
    } else {
      return [resolvedArgs[0]]
    }
  }

  _functionToString(resolvedArgs) {
    if (this._getTypeName(resolvedArgs[0]) === constants.TYPE_STRING) {
      return resolvedArgs[0]
    } else {
      return JSON.stringify(resolvedArgs[0])
    }
  }

  _functionToNumber(resolvedArgs) {
    const typeName = this._getTypeName(resolvedArgs[0])
    let convertedValue
    if (typeName === constants.TYPE_NUMBER) {
      return resolvedArgs[0]
    } else if (typeName === constants.TYPE_STRING) {
      convertedValue = +resolvedArgs[0]
      if (!isNaN(convertedValue)) {
        return convertedValue
      }
    }
    return null
  }

  _functionNotNull(resolvedArgs) {
    for (let i = 0; i < resolvedArgs.length; i++) {
      if (this._getTypeName(resolvedArgs[i]) !== constants.TYPE_NULL) {
        return resolvedArgs[i]
      }
    }
    return null
  }

  _functionSort(resolvedArgs) {
    const sortedArray = resolvedArgs[0].slice(0)
    sortedArray.sort()
    return sortedArray
  }

  _functionSortBy(resolvedArgs) {
    const sortedArray = resolvedArgs[0].slice(0)
    if (sortedArray.length === 0) {
      return sortedArray
    }
    const interpreter = this.getInterpreter()
    const exprefNode = resolvedArgs[1]
    const requiredType = this._getTypeName(
      interpreter.visit(exprefNode, sortedArray[0])
    )
    if (
      [constants.TYPE_NUMBER, constants.TYPE_STRING].indexOf(requiredType) < 0
    ) {
      throw new Error('TypeError')
    }
    const that = this
    // In order to get a stable sort out of an unstable
    // sort algorithm, we decorate/sort/undecorate (DSU)
    // by creating a new list of [index, element] pairs.
    // In the cmp function, if the evaluated elements are
    // equal, then the index will be used as the tiebreaker.
    // After the decorated list has been sorted, it will be
    // undecorated to extract the original elements.
    const decorated = []
    for (let i = 0; i < sortedArray.length; i++) {
      decorated.push([i, sortedArray[i]])
    }
    decorated.sort(function(a, b) {
      const exprA = interpreter.visit(exprefNode, a[1])
      const exprB = interpreter.visit(exprefNode, b[1])
      if (that._getTypeName(exprA) !== requiredType) {
        throw new Error(
          'TypeError: expected ' +
            requiredType +
            ', received ' +
            that._getTypeName(exprA)
        )
      } else if (that._getTypeName(exprB) !== requiredType) {
        throw new Error(
          'TypeError: expected ' +
            requiredType +
            ', received ' +
            that._getTypeName(exprB)
        )
      }
      if (exprA > exprB) {
        return 1
      } else if (exprA < exprB) {
        return -1
      } else {
        // If they're equal compare the items by their
        // order to maintain relative order of equal keys
        // (i.e. to get a stable sort).
        return a[0] - b[0]
      }
    })
    // Undecorate: extract out the original list elements.
    for (let j = 0; j < decorated.length; j++) {
      sortedArray[j] = decorated[j][1]
    }
    return sortedArray
  }

  _functionMaxBy(resolvedArgs) {
    const exprefNode = resolvedArgs[1]
    const resolvedArray = resolvedArgs[0]
    const keyFunction = this.createKeyFunction(exprefNode, [
      constants.TYPE_NUMBER,
      constants.TYPE_STRING
    ])
    let maxNumber = -Infinity
    let maxRecord
    let current
    for (let i = 0; i < resolvedArray.length; i++) {
      current = keyFunction(resolvedArray[i])
      if (current > maxNumber) {
        maxNumber = current
        maxRecord = resolvedArray[i]
      }
    }
    return maxRecord
  }

  _functionMinBy(resolvedArgs) {
    const exprefNode = resolvedArgs[1]
    const resolvedArray = resolvedArgs[0]
    const keyFunction = this.createKeyFunction(exprefNode, [
      constants.TYPE_NUMBER,
      constants.TYPE_STRING
    ])
    let minNumber = Infinity
    let minRecord
    let current
    for (let i = 0; i < resolvedArray.length; i++) {
      current = keyFunction(resolvedArray[i])
      if (current < minNumber) {
        minNumber = current
        minRecord = resolvedArray[i]
      }
    }
    return minRecord
  }

  createKeyFunction(exprefNode, allowedTypes) {
    const that = this
    const interpreter = this.getInterpreter()
    const keyFunc = function(x) {
      const current = interpreter.visit(exprefNode, x)
      if (allowedTypes.indexOf(that._getTypeName(current)) < 0) {
        const msg =
          'TypeError: expected one of ' +
          allowedTypes +
          ', received ' +
          that._getTypeName(current)
        throw new Error(msg)
      }
      return current
    }
    return keyFunc
  }
}
