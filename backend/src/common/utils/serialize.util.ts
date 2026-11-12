import Decimal from 'decimal.js';

/** Serialize Decimal fields to strings so JSON never loses precision. */
export function serializeDecimals<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (Decimal.isDecimal(val)) return (val as Decimal).toFixed(2);
      return val;
    }),
  ) as T;
}
