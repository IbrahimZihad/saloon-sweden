import { Prisma } from '@prisma/client';

/** Serialize Prisma.Decimal fields to strings so JSON never loses precision. */
export function serializeDecimals<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) =>
      val instanceof Prisma.Decimal ? val.toFixed(2) : val,
    ),
  ) as T;
}