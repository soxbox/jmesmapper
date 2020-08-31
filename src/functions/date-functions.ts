import { Runtime } from '../runtime';
import * as constants from '../constants';
import _ from 'lodash';
import { IFunctionTable } from '../types';

import { DateTime } from 'luxon';

export function dateParse(_runtime: Runtime, resolvedArgs: any[]): Date | null {
  const value = resolvedArgs[0];
  const format = resolvedArgs[1];
  let date;
  if (format) {
    date = DateTime.fromFormat(value, format);
  } else {
    date = DateTime.fromISO(value);
  }
  if (!date) {
    return null;
  }
  if (date.isValid) {
    return date.toJSDate();
  }
  return null;
}

export function dateFormat(
  _runtime: Runtime,
  resolvedArgs: any[]
): string | null {
  const date = resolvedArgs[0];
  const format = resolvedArgs[1];
  if (date) {
    if (format) {
      return DateTime.fromJSDate(date).toUTC().toFormat(format);
    }
    return DateTime.fromJSDate(date).toUTC().toISO();
  }
  return null;
}

function dateCurrent(_runtime: Runtime, resolvedArgs: any[]): Date {
    console.log('hit')
  return DateTime.utc().toJSDate();
}

export const definition: IFunctionTable = {
  now: {
    _func: dateCurrent,
    _signature: [],
  },
  date_parse: {
    _func: dateParse,
    _signature: [
      { types: [constants.TYPE_STRING, constants.TYPE_NULL] },
      { types: [constants.TYPE_STRING], optional: true },
    ],
  },
  date_format: {
    _func: dateFormat,
    _signature: [
      { types: [constants.TYPE_DATE, constants.TYPE_NULL] },
      { types: [constants.TYPE_STRING], optional: true },
    ],
  },
};
