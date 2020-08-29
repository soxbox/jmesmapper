import { Runtime } from '../runtime';

export function abs(_runtime: Runtime, resolvedArgs: any[]): number {
  return Math.abs(resolvedArgs[0]);
}

export function ceil(_runtime: Runtime, resolvedArgs: any[]): number {
  return Math.ceil(resolvedArgs[0]);
}

export function avg(_runtime: Runtime, resolvedArgs: any[]): number {
  let sum = 0;
  const inputArray = resolvedArgs[0];
  for (let i = 0; i < inputArray.length; i++) {
    sum += inputArray[i];
  }
  return sum / inputArray.length;
}

export function floor(_runtime: Runtime, resolvedArgs: any[]): number {
  return Math.floor(resolvedArgs[0]);
}

export function Sum(_runtime: Runtime, resolvedArgs: any[]): number {
  let sum = 0;
  const listToSum = resolvedArgs[0];
  for (let i = 0; i < listToSum.length; i++) {
    sum += listToSum[i];
  }
  return sum;
}
