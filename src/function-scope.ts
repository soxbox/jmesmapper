import { IFunctionTable, IFunctionTableType, IAst } from './types';
import * as constants from './constants';

export class FunctionScope {
  functionEntries: IFunctionTable = {};

  registerFunction(name: string, exprefNode: IAst): void {
    if (Object.prototype.hasOwnProperty.call(this.functionEntries, name)) {
      throw new Error(`Function ${name} cannot be redefined`);
    }
    this.functionEntries[name] = {
      _signature: [{ types: [constants.TYPE_ANY] }],
      _func: function (resolvedArgs: any[]) {
        // @ts-ignore
        const interpreter = this.getInterpreter();
        const data = resolvedArgs[0];
        return interpreter.visit(exprefNode, data);
      },
    };
  }

  getFunctionEntry(name: string): IFunctionTableType {
    return this.functionEntries[name];
  }
}
