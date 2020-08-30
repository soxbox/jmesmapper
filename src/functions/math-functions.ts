import { Runtime } from '../runtime';
import _ from 'lodash';
import { IFunctionTable } from '../types';
import * as constants from '../constants';

export function abs(_runtime: Runtime, resolvedArgs: any[]): number {
  return Math.abs(resolvedArgs[0]);
}

export function avg(_runtime: Runtime, resolvedArgs: any[]): number {
  let sum = 0;
  const inputArray = resolvedArgs[0];
  for (let i = 0; i < inputArray.length; i++) {
    sum += inputArray[i];
  }
  return sum / inputArray.length;
}

export function sum(_runtime: Runtime, resolvedArgs: any[]): number {
  let sum = 0;
  const listToSum = resolvedArgs[0];
  for (let i = 0; i < listToSum.length; i++) {
    sum += listToSum[i];
  }
  return sum;
}

export function add(_runtime: Runtime, resolvedArgs: any[]): number {
  const augend = resolvedArgs[0];
  const addend = resolvedArgs[1];
  return augend + addend;
}

export function subtract(_runtime: Runtime, resolvedArgs: any[]): number {
  const minuend = resolvedArgs[0];
  const subtrahend = resolvedArgs[1];
  return minuend - subtrahend;
}

export function multiply(_runtime: Runtime, resolvedArgs: any[]): number {
  const multiplier = resolvedArgs[0];
  const multiplicand = resolvedArgs[1];
  return multiplier * multiplicand;
}

export function divide(_runtime: Runtime, resolvedArgs: any[]): number {
  const dividend = resolvedArgs[0];
  const divisor = resolvedArgs[1];
  return dividend / divisor;
}

export function round(_runtime: Runtime, resolvedArgs: any[]): number {
  return _.round(resolvedArgs[0], resolvedArgs[1]);
}

export function floor(_runtime: Runtime, resolvedArgs: any[]): number {
  return _.floor(resolvedArgs[0], resolvedArgs[1]);
}

export function ceil(_runtime: Runtime, resolvedArgs: any[]): number {
  return _.ceil(resolvedArgs[0], resolvedArgs[1]);
}

export function inRange(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return _.inRange(resolvedArgs[0], resolvedArgs[1], resolvedArgs[2]);
}

export const definition: IFunctionTable = {
  abs: {
    _func: abs,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }]
  },
  add: {
    _func: add,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }, {
      types: [constants.TYPE_NUMBER]
    }]
  },
  avg: {
    _func: avg,
    _signature: [{
      types: [constants.TYPE_ARRAY_NUMBER]
    }]
  },
  ceil: {
    _func: ceil,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }]
  },
  divide: {
    _func: divide,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }, {
      types: [constants.TYPE_NUMBER]
    }]
  },
  floor: {
    _func: floor,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }]
  },
  in_range: {
    _func: inRange,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }, {
      types: [constants.TYPE_NUMBER]
    }, {
      types: [constants.TYPE_NUMBER],
      optional: true
    }]
  },
  multiply: {
    _func: multiply,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }, {
      types: [constants.TYPE_NUMBER]
    }]
  },
  round: {
    _func: round,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }, {
      optional: true,
      types: [constants.TYPE_NUMBER]
    }]
  },
  subtract: {
    _func: subtract,
    _signature: [{
      types: [constants.TYPE_NUMBER]
    }, {
      types: [constants.TYPE_NUMBER]
    }]
  },
  sum: {
    _func: sum,
    _signature: [{
      types: [constants.TYPE_ARRAY_NUMBER]
    }]
  }
};