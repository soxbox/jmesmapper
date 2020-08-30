import { Runtime } from '../runtime';
import _ from 'lodash';
import * as constants from '../constants';
import { IFunctionTable } from '../types';

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

export function words(_runtime: Runtime, resolvedArgs: any[]): string[] {
  return _.words(resolvedArgs[0], resolvedArgs[1]);
}

export function upperFirst(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.upperFirst(resolvedArgs[0]);
}

export function toString(runtime: Runtime, resolvedArgs: any[]): string {
  if (runtime._getTypeName(resolvedArgs[0]) === constants.TYPE_STRING) {
    return resolvedArgs[0];
  } else {
    return JSON.stringify(resolvedArgs[0]);
  }
}

export function substr(_runtime: Runtime, resolvedArgs: any[]): string {
  return resolvedArgs[0].substr(resolvedArgs[1], resolvedArgs[2]);
}

export function camelCase(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.camelCase(resolvedArgs[0]);
}

export function kebabCase(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.kebabCase(resolvedArgs[0]);
}

export function snameCase(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.snakeCase(resolvedArgs[0]);
}

export function pad(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.pad(resolvedArgs[0], resolvedArgs[1], resolvedArgs[2]);
}

export function padEnd(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.padEnd(resolvedArgs[0], resolvedArgs[1], resolvedArgs[2]);
}

export function padStart(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.padStart(resolvedArgs[0], resolvedArgs[1], resolvedArgs[2]);
}

export function escape(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.escape(resolvedArgs[0]);
}

export function unescape(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.unescape(resolvedArgs[0]);
}

export function repeat(_runtime: Runtime, resolvedArgs: any[]): string {
  return _.repeat(resolvedArgs[0], resolvedArgs[1]);
}

export function truncate(_runtime: Runtime, resolvedArgs: any[]): string {
  const options = _.pick(resolvedArgs[1] || {}, [
    'length',
    'omission',
    'separator',
  ]);

  return _.truncate(resolvedArgs[0], options);
}

export const definition: IFunctionTable = {
  camel_case: {
    _func: camelCase,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  contains: {
    _func: contains,
    _signature: [{
      types: [constants.TYPE_STRING, constants.TYPE_ARRAY]
    }, {
      types: [constants.TYPE_ANY]
    }]
  },
  ends_with: {
    _func: endsWith,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_STRING]
    }]
  },
  escape: {
    _func: escape,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  kebab_case: {
    _func: kebabCase,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  lower: {
    _func: lower,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  pad: {
    _func: pad,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_NUMBER]
    }, {
      optional: true,
      types: [constants.TYPE_STRING]
    }]
  },
  pad_end: {
    _func: padEnd,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_NUMBER]
    }, {
      optional: true,
      types: [constants.TYPE_STRING]
    }]
  },
  pad_start: {
    _func: padStart,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_NUMBER]
    }, {
      optional: true,
      types: [constants.TYPE_STRING]
    }]
  },
  repeat: {
    _func: repeat,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_NUMBER]
    }]
  },
  replace: {
    _func: replace,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_STRING, constants.TYPE_REGEXP]
    }, {
      types: [constants.TYPE_STRING]
    }]
  },
  sname_case: {
    _func: snameCase,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  split: {
    _func: split,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_STRING, constants.TYPE_REGEXP]
    }]
  },
  starts_with: {
    _func: startsWith,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_STRING]
    }]
  },
  substr: {
    _func: substr,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_NUMBER]
    }, {
      optional: true,
      types: [constants.TYPE_NUMBER]
    }]
  },
  to_string: {
    _func: toString,
    _signature: [{
      types: [constants.TYPE_ANY]
    }]
  },
  trim: {
    _func: trim,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  truncate: {
    _func: truncate,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      types: [constants.TYPE_OBJECT],
      optional: true
    }]
  },
  unescape: {
    _func: unescape,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  upper: {
    _func: upper,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  upper_first: {
    _func: upperFirst,
    _signature: [{
      types: [constants.TYPE_STRING]
    }]
  },
  words: {
    _func: words,
    _signature: [{
      types: [constants.TYPE_STRING]
    }, {
      optional: true,
      types: [constants.TYPE_STRING, constants.TYPE_REGEXP]
    }]
  }
};