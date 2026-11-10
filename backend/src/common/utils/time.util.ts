import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Europe/Stockholm';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertDateOnly(value: string): string {
  if (!DATE_ONLY_RE.test(value)) {
    throw new Error(`Invalid date: ${value} (expected YYYY-MM-DD)`);
  }
  return value;
}

/** Local YYYY-MM-DD for an instant in the given timezone. */
export function localDateStr(instant: Date, tz: string = DEFAULT_TIMEZONE): string {
  return format(toZonedTime(instant, tz), 'yyyy-MM-dd', { timeZone: tz });
}

/** Local HH:mm for an instant in the given timezone. */
export function localTimeStr(instant: Date, tz: string = DEFAULT_TIMEZONE): string {
  return format(toZonedTime(instant, tz), 'HH:mm', { timeZone: tz });
}

/** Weekday of a local date string: 0 = Monday ... 6 = Sunday. */
export function weekdayFromDateStr(dateStr: string): number {
  assertDateOnly(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (jsDay + 6) % 7;
}

/** Convert local wall-clock time (minutes since midnight) on a date to a UTC instant. */
export function zonedDateTimeToUtc(
  dateStr: string,
  minutes: number,
  tz: string = DEFAULT_TIMEZONE,
): Date {
  assertDateOnly(dateStr);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const wall = `${dateStr}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
  return fromZonedTime(wall, tz);
}

/** Minutes since local midnight for an instant. */
export function minutesOfDayLocal(instant: Date, tz: string = DEFAULT_TIMEZONE): number {
  const zoned = toZonedTime(instant, tz);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

/** Add days to a local date string, returning a local date string. */
export function addDaysToDateStr(dateStr: string, days: number): string {
  assertDateOnly(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

export function todayLocalStr(tz: string = DEFAULT_TIMEZONE, now: Date = new Date()): string {
  return localDateStr(now, tz);
}

/** True when two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap. */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Round an instant up to the next interval boundary aligned to local midnight. */
export function ceilToInterval(instant: Date, intervalMinutes: number, tz: string = DEFAULT_TIMEZONE): Date {
  const dateStr = localDateStr(instant, tz);
  const minutes = minutesOfDayLocal(instant, tz);
  const remainder = minutes % intervalMinutes;
  const rounded = remainder === 0 && instant.getTime() === zonedDateTimeToUtc(dateStr, minutes, tz).getTime()
    ? minutes
    : minutes + (intervalMinutes - remainder);
  return zonedDateTimeToUtc(dateStr, rounded, tz);
}