
interface IObject {
    [key: string]: any
}

export class ScopeChain {
  scopes: IObject[] = [];

  pushScope(scope: any) {
    this.scopes.push(scope);
  }

  popScope() {
    this.scopes.pop();
  }

  resolveReference(name: string) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const currentScope = this.scopes[i];
      const currentValue = currentScope[name];
      if (currentValue !== undefined) {
        return currentValue;
      }
    }
    return null;
  }
}
