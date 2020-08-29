import { Runtime } from '../runtime';
import * as constants from '../constants';

export function type(
  runtime: Runtime,
  resolvedArgs: any[]
): string | undefined {
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
