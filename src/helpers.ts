type ObjectType = { [key: string]: any };

export function isArray(obj: any): boolean {
  if (obj !== null) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  } else {
    return false;
  }
}

export function isObject(obj: any): boolean {
  if (obj !== null) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  } else {
    return false;
  }
}

export function strictDeepEqual(first: any, second: any): boolean {
  // Check the scalar case first.
  if (first === second) {
    return true;
  }

  // Check if they are the same type.
  const firstType = Object.prototype.toString.call(first);
  if (firstType !== Object.prototype.toString.call(second)) {
    return false;
  }
  // We know that first and second have the same type so we can just check the
  // first type from now on.
  if (isArray(first) === true) {
    // Short circuit if they're not the same length;
    if (first.length !== second.length) {
      return false;
    }
    for (let i = 0; i < first.length; i++) {
      if (strictDeepEqual(first[i], second[i]) === false) {
        return false;
      }
    }
    return true;
  }
  if (isObject(first) === true) {
    // An object is equal if it has the same key/value pairs.
    const keysSeen: { [key: string]: boolean } = {};
    for (const key in first) {
      if (Object.prototype.hasOwnProperty.call(first, key)) {
        if (strictDeepEqual(first[key], second[key]) === false) {
          return false;
        }
        keysSeen[key] = true;
      }
    }
    // Now check that there aren't any keys in second that weren't
    // in first.
    for (const key2 in second) {
      if (Object.prototype.hasOwnProperty.call(second, key2)) {
        if (keysSeen[key2] !== true) {
          return false;
        }
      }
    }
    return true;
  }
  return false;
}

export function isFalse(obj: any): boolean {
  // From the spec:
  // A false value corresponds to the following values:
  // Empty list
  // Empty object
  // Empty string
  // False boolean
  // null value

  // First check the scalar values.
  if (obj === '' || obj === false || obj === null) {
    return true;
  } else if (isArray(obj) && obj.length === 0) {
    // Check for an empty array.
    return true;
  } else if (isObject(obj)) {
    // Check for an empty object.
    for (const key in obj) {
      // If there are any keys, then
      // the object is not empty so the object
      // is not false.
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

export function objValues(obj: ObjectType): any[] {
  const keys = Object.keys(obj);
  const values = [];
  for (let i = 0; i < keys.length; i++) {
    values.push(obj[keys[i]]);
  }
  return values;
}

export function merge(a: ObjectType, b: ObjectType): ObjectType {
  const merged: ObjectType = {};
  for (const key in a) {
    merged[key] = a[key];
  }
  for (const key2 in b) {
    merged[key2] = b[key2];
  }
  return merged;
}
// @ts-ignore
const trimLeftBuiltIn = !!String.prototype.trimLeft;

export function trimLeft(str: string): string {
// @ts-ignore
return trimLeftBuiltIn ? str.trimLeft() : (str.match(/^\s*(.*)/) || [])[1];
}

export function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

export function isNum(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-';
}
export function isAlphaNum(ch: string): boolean {
  return (
    (ch >= 'a' && ch <= 'z') ||
    (ch >= 'A' && ch <= 'Z') ||
    (ch >= '0' && ch <= '9') ||
    ch === '_'
  );
}
