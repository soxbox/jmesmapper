import { Runtime } from '../runtime';
import * as helpers from '../helpers';
import * as constants from '../constants';
import { IAst, IFunctionTable } from '../types';

export function letFunction(runtime: Runtime, resolvedArgs: IAst[]): any {
  const scope = resolvedArgs[0];
  const exprefNode = resolvedArgs[1];
  const interpreter = runtime.getInterpreter();
  if (exprefNode.jmespathType !== 'Expref') {
    throw new Error('TypeError: expected ExpreRef, received ' + exprefNode.type);
  }
  interpreter.scopeChain.pushScope(scope);
  try {
    return interpreter.visit(exprefNode, exprefNode.context);
  } finally {
    interpreter.scopeChain.popScope();
  }
}

export function ifFunction(runtime: Runtime, resolvedArgs: any[]): any {
  const expression = resolvedArgs[0];
  const thenExpr = resolvedArgs[1];
  const elseExpr = resolvedArgs[2];
  const interpreter = runtime.getInterpreter();
  if (expression) {
    return interpreter.visit(thenExpr, thenExpr.context);
  }
  if (elseExpr) {
    return interpreter.visit(elseExpr, elseExpr.context);
  }
}

export function define(runtime: Runtime, resolvedArgs: any[]): any {
  const name = resolvedArgs[0];
  const expRef = resolvedArgs[1];
  runtime.dynamicFunctions.registerFunction(name, expRef);
  return expRef.context;
}

export function isDefined(runtime: Runtime, resolvedArgs: any[]): boolean {
  const func = runtime.dynamicFunctions.getFunctionEntry(resolvedArgs[0]);
  return func !== undefined;
}

export function caseFunction(runtime: Runtime, resolvedArgs: any[]): any {
  const interpreter = runtime.getInterpreter();
  for (let i = 0; i < resolvedArgs.length; i++) {
    if (helpers.isArray(resolvedArgs[i])) {
      if (resolvedArgs[i].length !== 2) {
        throw new Error(
          'TypeError: expected ' +
            constants.TYPE_NAME_TABLE[constants.TYPE_ARRAY_EXPREF] +
            ' to have 2 elements For case conditions',
        );
      }
      if (interpreter.visit(resolvedArgs[i][0], resolvedArgs[i][0].context)) {
        return interpreter.visit(resolvedArgs[i][1], resolvedArgs[i][0].context);
      }
    } else {
      return interpreter.visit(resolvedArgs[i], resolvedArgs[i].context);
    }
  }
  return null;
}

export const definition: IFunctionTable = {
  case: {
    _func: caseFunction,
    _signature: [
      {
        types: [constants.TYPE_EXPREF, constants.TYPE_ARRAY_EXPREF],
        variadic: true,
      },
    ],
  },
  define: {
    _func: define,
    _signature: [
      {
        types: [constants.TYPE_STRING],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  if: {
    _func: ifFunction,
    _signature: [
      {
        types: [constants.TYPE_ANY],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
      {
        optional: true,
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
  is_defined: {
    _func: isDefined,
    _signature: [
      {
        types: [constants.TYPE_STRING],
      },
    ],
  },
  let: {
    _func: letFunction,
    _signature: [
      {
        types: [constants.TYPE_OBJECT],
      },
      {
        types: [constants.TYPE_EXPREF],
      },
    ],
  },
};
