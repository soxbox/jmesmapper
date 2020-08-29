import { Runtime } from '../runtime';
import { words, upperFirst } from 'lodash';
import * as constants from '../constants';

export function contains(_runtime: Runtime, resolvedArgs: any[]): boolean {
  return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
}

export function endsWith(_runtime: Runtime, resolvedArgs: any[]): boolean {
  const searchStr = resolvedArgs[0];
  const suffix = resolvedArgs[1];
  return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
}

export function startsWith(_runtime: Runtime, resolvedArgs: any[]): boolean {
    return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
  }


  export function lower(_runtime: Runtime, resolvedArgs: any[]): string {
    return resolvedArgs[0].toLowerCase();
  }

  export function upper(_runtime: Runtime, resolvedArgs: any[]): string {
    return resolvedArgs[0].toUpperCase();
  }

  export function trim(_runtime: Runtime, resolvedArgs: any[]): number | null {
    return resolvedArgs[0].trim();
  }

  export function split(_runtime: Runtime, resolvedArgs: any[]): number | null {
    return resolvedArgs[0].split(resolvedArgs[1]);
  }

  export function replace(_runtime: Runtime, resolvedArgs: any[]): string {
    return resolvedArgs[0].replace(resolvedArgs[1], resolvedArgs[2]);
  }

  export function wordsFunction(_runtime: Runtime, resolvedArgs: any[]): string[] {
    return words(resolvedArgs[0], resolvedArgs[1]);
  }

  export function upperFirstFunction(_runtime: Runtime, resolvedArgs: any[]): string {
    return upperFirst(resolvedArgs[0]);
  }

  export function toString(runtime: Runtime, resolvedArgs: any[]): string {
    if (runtime._getTypeName(resolvedArgs[0]) === constants.TYPE_STRING) {
      return resolvedArgs[0];
    } else {
      return JSON.stringify(resolvedArgs[0]);
    }
  }
