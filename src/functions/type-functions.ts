import { Runtime } from '../runtime';
import * as constants from '../constants';
import _ from 'lodash';
import { IFunctionTable } from '../types';

export function type(runtime: Runtime, resolvedArgs: any[]): string | undefined {
  switch (runtime._getTypeName(resolvedArgs[0])) {
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

export function notNull(runtime: Runtime, resolvedArgs: any[]): boolean | null {
  for (let i = 0; i < resolvedArgs.length; i++) {
    if (runtime._getTypeName(resolvedArgs[i]) !== constants.TYPE_NULL) {
      return resolvedArgs[i];
    }
  }
  return null;
}

export function isNull(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isNull(resolvedArgs[0]);
}

export function isString(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isString(resolvedArgs[0]);
}

export function isNil(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isNil(resolvedArgs[0]);
}

export function isBoolean(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isBoolean(resolvedArgs[0]);
}

export function isArray(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isArray(resolvedArgs[0]);
}

export function isObject(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isPlainObject(resolvedArgs[0]);
}

export function isNaN(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isNaN(resolvedArgs[0]);
}

export function isInteger(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isInteger(resolvedArgs[0]);
}

export function isDate(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isDate(resolvedArgs[0]);
}

export function isNumber(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.isNumber(resolvedArgs[0]);
}

export function isEmpty(_runtime: Runtime, resolvedArgs: any[]): boolean {
  const value = resolvedArgs[0];
  if (_.isNil(value)) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Object.prototype.toString.call(value) === '[object Array]' && value.length === 0) {
    return true;
  }
  if (Object.prototype.toString.call(value) === '[object Object]' && Object.keys(value).length === 0) {
    return true;
  }
  return false;
}

export const definition: IFunctionTable = {
  is_array: {
    _func: isArray,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_boolean: {
    _func: isBoolean,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_date: {
    _func: isDate,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_empty: {
    _func: isEmpty,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_integer: {
    _func: isInteger,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_nan: {
    _func: isNaN,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_nil: {
    _func: isNil,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_null: {
    _func: isNull,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_number: {
    _func: isNumber,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_object: {
    _func: isObject,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  is_string: {
    _func: isString,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  not_null: {
    _func: notNull,
    _signature: [
      {
        types: [constants.TYPE_ANY],
        variadic: true,
      },
    ],
  },
  type: {
    _func: type,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
};
