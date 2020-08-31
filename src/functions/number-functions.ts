import { Runtime } from '../runtime';
import * as constants from '../constants';
import { IFunctionTable } from '../types';

export function max(runtime: Runtime, resolvedArgs: any[]): number | null {
  if (resolvedArgs[0].length > 0) {
    const typeName = runtime._getTypeName(resolvedArgs[0][0]);
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

export function min(runtime: Runtime, resolvedArgs: any[]): number | null {
  if (resolvedArgs[0].length > 0) {
    const typeName = runtime._getTypeName(resolvedArgs[0][0]);
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

export function toNumber(runtime: Runtime, resolvedArgs: any[]): number | null {
  const typeName = runtime._getTypeName(resolvedArgs[0]);
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

export const definition: IFunctionTable = {
  max: {
    _func: max,
    _signature: [
      {
        types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING],
      },
    ],
  },
  min: {
    _func: min,
    _signature: [
      {
        types: [constants.TYPE_ARRAY_NUMBER, constants.TYPE_ARRAY_STRING],
      },
    ],
  },
  to_number: {
    _func: toNumber,
    _signature: [{ types: [constants.TYPE_ANY] }],
  },
};
