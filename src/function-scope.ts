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
      _func: (runtime: Runtime, resolvedArgs: any[]) => {
        // @ts-ignore
        const interpreter = runtime.getInterpreter();
        const data = resolvedArgs[0];
        return interpreter.visit(exprefNode, data);
      },
      _signature: [{ types: [constants.TYPE_ANY] }],
    };
  }

  getFunctionEntry(name: string): IFunctionTableType {
    return this.functionEntries[name];
  }
}
