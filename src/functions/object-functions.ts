import { Runtime } from '../runtime';
import _ from 'lodash';
import { IFunctionTable } from '../types';
import * as constants from '../constants';

export function merge(_runtime: Runtime, resolvedArgs: any[]): { [key: string]: any } {
  const merged: { [key: string]: any } = {};
  for (let i = 0; i < resolvedArgs.length; i++) {
    const current = resolvedArgs[i];
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        merged[key] = current[key];
      }
    }
  }
  return merged;
}

export function toEntires(_runtime: Runtime, resolvedArgs: any[]): any {
  const data = resolvedArgs[0];
  const objKeys = Object.keys(data);
  const entries = [];
  for (let i = 0; i < objKeys.length; i++) {
    const key = objKeys[i];
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      entries.push({
        key,
        value: data[key],
      });
    }
  }
  return entries;
}

export function fromEntires(_runtime: Runtime, resolvedArgs: any[]): any {
  return resolvedArgs[0].reduce((out: { [key: string]: any }, { key, value }: { key: string; value: any }) => {
    out[key] = value;
    return out;
  }, {});
}

export function keys(_runtime: Runtime, resolvedArgs: any[]): string[] {
  return Object.keys(resolvedArgs[0]);
}

export function values(_runtime: Runtime, resolvedArgs: any[]): any[] {
  const obj = resolvedArgs[0];
  const objKeys = Object.keys(obj);
  const valuesArr = [];
  for (let i = 0; i < objKeys.length; i++) {
    valuesArr.push(obj[objKeys[i]]);
  }
  return valuesArr;
}

export function pick(_runtime: Runtime, resolvedArgs: any[]): object {
  return _.pick(resolvedArgs[0], resolvedArgs[1]);
}

export function omit(_runtime: Runtime, resolvedArgs: any[]): object {
  return _.omit(resolvedArgs[0], resolvedArgs[1]);
}

export function hasKey(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return Object.prototype.hasOwnProperty.call(resolvedArgs[0], resolvedArgs[1]);
}

export const definition: IFunctionTable = {
  from_entries: {
    _func: fromEntires,
    _signature: [
      {
        types: [constants.TYPE_ARRAY_OBJECT],
      },
    ],
  },
  has_key: {
    _func: hasKey,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
      },
      {
        types: [constants.TYPE_STRING],
      },
    ],
  },
  keys: {
    _func: keys,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
      },
    ],
  },
  merge: {
    _func: merge,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
        variadic: true,
      },
    ],
  },
  omit: {
    _func: omit,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
      },
      {
        types: [constants.TYPE_STRING, constants.TYPE_ARRAY_STRING],
      },
    ],
  },
  pick: {
    _func: pick,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
      },
      {
        types: [constants.TYPE_STRING, constants.TYPE_ARRAY_STRING],
      },
    ],
  },
  to_entries: {
    _func: toEntires,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
      },
    ],
  },
  values: {
    _func: values,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
      },
    ],
  },
};
