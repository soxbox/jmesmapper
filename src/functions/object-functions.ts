import { Runtime } from '../runtime';

export function merge(
  _runtime: Runtime,
  resolvedArgs: any[]
): { [key: string]: any } {
  const merged: { [key: string]: any } = {};
  for (let i = 0; i < resolvedArgs.length; i++) {
    const current = resolvedArgs[i];
    for (const key in current) {
      merged[key] = current[key];
    }
  }
  return merged;
}

export function toEntires(_runtime: Runtime, resolvedArgs: any[]): any {
  const data = resolvedArgs[0];
  const keys = Object.keys(data);
  const entries = [];
  for (let i = 0; i < keys.length; i++) {
    if (Object.prototype.hasOwnProperty.call(data, keys[i])) {
      entries.push({
        key: keys[i],
        value: data[keys[i]],
      });
    }
  }
  return entries;
}

export function fromEntires(_runtime: Runtime, resolvedArgs: any[]): any {
  return resolvedArgs[0].reduce(
    (
      out: { [key: string]: any },
      { key, value }: { key: string; value: any }
    ) => {
      out[key] = value;
      return out;
    },
    {}
  );
}

export function keys(_runtime: Runtime, resolvedArgs: any[]): string[] {
  return Object.keys(resolvedArgs[0]);
}

export function values(_runtime: Runtime, resolvedArgs: any[]): any[] {
  const obj = resolvedArgs[0];
  const keys = Object.keys(obj);
  const values = [];
  for (let i = 0; i < keys.length; i++) {
    values.push(obj[keys[i]]);
  }
  return values;
}
