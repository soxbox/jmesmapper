import { IFunctionTable, IFunctionTableType, IAst } from './types';
import * as constants from './constants';
import { Runtime } from './runtime';

export class FunctionScope {
  functionEntries: IFunctionTable = {};

  registerFunction(name: string, exprefNode: IAst): void {
    if (Object.prototype.hasOwnProperty.call(this.functionEntries, name)) {
      throw new Error(`Function ${name} cannot be redefined`);
    }
    this.functionEntries[name] = {
      _signature: [{ types: [constants.TYPE_ANY] }],
      _func: function (runtime: Runtime, resolvedArgs: any[]) {
        // @ts-ignore
        const interpreter = runtime.getInterpreter();
        const data = resolvedArgs[0];
        return interpreter.visit(exprefNode, data);
      },
    };
  }

  getFunctionEntry(name: string): IFunctionTableType {
    return this.functionEntries[name];
  }
}
