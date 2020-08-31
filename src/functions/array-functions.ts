import { Runtime } from '../runtime';
import * as helpers from '../helpers';
import * as constants from '../constants';
import _ from 'lodash';
import { IFunctionTable } from '../types';

export function length(_runtime: Runtime, resolvedArgs: any[]): number {
  if (!helpers.isObject(resolvedArgs[0])) {
    return resolvedArgs[0].length;
  } else {
    // As far as I can tell, there's no way to get the length
    // of an object without O(n) iteration through the object.
    return Object.keys(resolvedArgs[0]).length;
  }
}

export function map(runtime: Runtime, resolvedArgs: any[]): any[] {
  const mapped = [];
  const interpreter = runtime.getInterpreter();
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

export function find(runtime: Runtime, resolvedArgs: any[]): any {
  const data: any[] = resolvedArgs[0];
  const exprefNode = resolvedArgs[1];
  const interpreter = runtime.getInterpreter();

  for (let i = 1; i <= data.length; i++) {
    if (interpreter.visit(exprefNode, data[i])) {
      return data[i];
    }
  }
  return null;
}

export function findLast(runtime: Runtime, resolvedArgs: any[]): any {
  const data: any[] = resolvedArgs[0];
  const exprefNode = resolvedArgs[1];
  const interpreter = runtime.getInterpreter();

  for (let i = data.length - 1; i > -1; i--) {
    if (interpreter.visit(exprefNode, data[i])) {
      return data[i];
    }
  }
  return null;
}

export function findIndex(runtime: Runtime, resolvedArgs: any[]): number {
  const data: any[] = resolvedArgs[0];
  const exprefNode = resolvedArgs[1];
  const interpreter = runtime.getInterpreter();

  for (let i = 1; i <= data.length; i++) {
    if (interpreter.visit(exprefNode, data[i])) {
      return i;
    }
  }
  return -1;
}

export function findLastIndex(runtime: Runtime, resolvedArgs: any[]): any {
  const data: any[] = resolvedArgs[0];
  const exprefNode = resolvedArgs[1];
  const interpreter = runtime.getInterpreter();

  for (let i = data.length - 1; i > -1; i--) {
    if (interpreter.visit(exprefNode, data[i])) {
      return i;
    }
  }
  return null;
}

export function maxBy(runtime: Runtime, resolvedArgs: any[]): any {
  const exprefNode = resolvedArgs[1];
  const resolvedArray = resolvedArgs[0];
  const keyFunction = runtime.createKeyFunction(exprefNode, [constants.TYPE_NUMBER, constants.TYPE_STRING]);
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

export function reverse(runtime: Runtime, resolvedArgs: any[]): any[] | string {
  const typeName = runtime._getTypeName(resolvedArgs[0]);
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

export function minBy(runtime: Runtime, resolvedArgs: any[]): any {
  const exprefNode = resolvedArgs[1];
  const resolvedArray = resolvedArgs[0];
  const keyFunction = runtime.createKeyFunction(exprefNode, [constants.TYPE_NUMBER, constants.TYPE_STRING]);
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

export function join(_runtime: Runtime, resolvedArgs: any[]): string {
  const joinChar = resolvedArgs[0];
  const listJoin = resolvedArgs[1];
  return listJoin.join(joinChar);
}

export function toArray(runtime: Runtime, resolvedArgs: any[]): any[] {
  if (runtime._getTypeName(resolvedArgs[0]) === constants.TYPE_ARRAY) {
    return resolvedArgs[0];
  } else {
    return [resolvedArgs[0]];
  }
}

export function sort(_runtime: Runtime, resolvedArgs: any[]): any[] {
  const sortedArray = resolvedArgs[0].slice(0);
  sortedArray.sort();
  return sortedArray;
}

export function sortBy(runtime: Runtime, resolvedArgs: any[]): any[] {
  const sortedArray = resolvedArgs[0].slice(0);
  if (sortedArray.length === 0) {
    return sortedArray;
  }
  const interpreter = runtime.getInterpreter();
  const exprefNode = resolvedArgs[1];
  const requiredType = runtime._getTypeName(interpreter.visit(exprefNode, sortedArray[0]));
  if (
    // @ts-ignore
    [constants.TYPE_NUMBER, constants.TYPE_STRING].indexOf(requiredType) < 0
  ) {
    throw new Error('TypeError');
  }

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
  decorated.sort((a, b) => {
    const exprA = interpreter.visit(exprefNode, a[1]);
    const exprB = interpreter.visit(exprefNode, b[1]);
    if (runtime._getTypeName(exprA) !== requiredType) {
      throw new Error('TypeError: expected ' + requiredType + ', received ' + runtime._getTypeName(exprA));
    } else if (runtime._getTypeName(exprB) !== requiredType) {
      throw new Error('TypeError: expected ' + requiredType + ', received ' + runtime._getTypeName(exprB));
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

export function groupBy(runtime: Runtime, resolvedArgs: any[]): any {
  const items = resolvedArgs[0].slice(0);
  if (items.length === 0) {
    return items;
  }
  const interpreter = runtime.getInterpreter();
  const exprefNode = resolvedArgs[1];
  const requiredType = runtime._getTypeName(interpreter.visit(exprefNode, items[0]));
  if (
    // @ts-ignore
    [constants.TYPE_NUMBER, constants.TYPE_STRING].indexOf(requiredType) < 0
  ) {
    throw new Error('TypeError');
  }

  return items.reduce((out: { [key: string]: any }, item: { [key: string]: any }) => {
    const value = interpreter.visit(exprefNode, item);
    if (!Object.prototype.hasOwnProperty.call(out, value)) {
      out[value] = [];
    }
    out[value].push(item);
    return out;
  }, {});
}

export function chunk(_runtime: Runtime, resolvedArgs: any[]): any[][] {
  return _.chunk(resolvedArgs[0], resolvedArgs[1]);
}

export function difference(_runtime: Runtime, resolvedArgs: any[]): any[] {
  return _.difference(resolvedArgs[0], resolvedArgs[1]);
}

export function intersection(_runtime: Runtime, resolvedArgs: any[]): any[] {
  return _.intersection(resolvedArgs[0], resolvedArgs[1]);
}

export function keyBy(runtime: Runtime, resolvedArgs: any[]): object {
  const data = resolvedArgs[0];
  const interpreter = runtime.getInterpreter();
  const out: { [key: string]: any } = {};

  for (let i = 0; i < data.length; i++) {
    const key = interpreter.visit(resolvedArgs[1], data[i]);
    out[key] = data[i];
  }
  return out;
}

export function some(runtime: Runtime, resolvedArgs: any[]): boolean {
  const data = resolvedArgs[0];
  const expref = resolvedArgs[1];
  const interpreter = runtime.getInterpreter();
  for (let i = 0; i < data.length; i++) {
    if (interpreter.visit(expref, data[i])) {
      return true;
    }
  }
  return false;
}

export function every(runtime: Runtime, resolvedArgs: any[]): boolean {
  const data = resolvedArgs[0];
  const expref = resolvedArgs[1];
  const interpreter = runtime.getInterpreter();
  for (let i = 0; i < data.length; i++) {
    if (!interpreter.visit(expref, data[i])) {
      return false;
    }
  }
  return true;
}

export function uniqueBy(runtime: Runtime, resolvedArgs: any[]): any[] {
  const exprefNode = resolvedArgs[1];
  const data = resolvedArgs[0];
  const keyFunction = runtime.createKeyFunction(exprefNode, [
    constants.TYPE_NUMBER,
    constants.TYPE_STRING,
    constants.TYPE_BOOLEAN,
    constants.TYPE_NULL,
  ]);
  const result: { [key: string]: any } = {};
  for (let i = 0; i < data.length; i++) {
    const key = keyFunction(data[i]);
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = data[i];
    }
  }
  return _.values(result);
}

export const definition: IFunctionTable = {
  chunk: {
    _func: chunk,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_NUMBER],
      },
    ],
  },
  difference: {
    _func: difference,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_ARRAY],
      },
    ],
  },
  every: {
    _func: every,
    _signature: [{ types: [constants.TYPE_ARRAY_OBJECT] }, { types: [constants.TYPE_EXPREF] }],
  },
  find: {
    _func: find,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  find_index: {
    _func: findIndex,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  find_last: {
    _func: findLast,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  find_last_index: {
    _func: findLastIndex,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  group_by: {
    _func: groupBy,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  intersection: {
    _func: intersection,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_ARRAY],
      },
    ],
  },
  join: {
    _func: join,
    _signature: [
      {
        types: [constants.TYPE_STRING],
      },
      {
        types: [constants.TYPE_ARRAY_STRING],
      },
    ],
  },
  key_by: {
    _func: keyBy,
    _signature: [
      {
        types: [constants.TYPE_ARRAY_OBJECT],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  length: {
    _func: length,
    _signature: [
      {
        types: [constants.TYPE_STRING, constants.TYPE_ARRAY, constants.TYPE_OBJECT],
      },
    ],
  },
  map: {
    _func: map,
    _signature: [
      {
        types: [constants.TYPE_EXPREF],
      },
      {
        types: [constants.TYPE_ARRAY],
      },
    ],
  },
  max_by: {
    _func: maxBy,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  min_by: {
    _func: minBy,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  reverse: {
    _func: reverse,
    _signature: [
      {
        types: [constants.TYPE_STRING, constants.TYPE_ARRAY],
      },
    ],
  },
  some: {
    _func: some,
    _signature: [{ types: [constants.TYPE_ARRAY_OBJECT] }, { types: [constants.TYPE_EXPREF] }],
  },
  sort: {
    _func: sort,
    _signature: [
      {
        types: [constants.TYPE_ARRAY_STRING, constants.TYPE_ARRAY_NUMBER],
      },
    ],
  },
  sort_by: {
    _func: sortBy,
    _signature: [
      {
        types: [constants.TYPE_ARRAY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  to_array: {
    _func: toArray,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
    ],
  },
  unique_by: {
    _func: uniqueBy,
    _signature: [{ types: [constants.TYPE_ARRAY] }, { types: [constants.TYPE_EXPREF] }],
  },
};
