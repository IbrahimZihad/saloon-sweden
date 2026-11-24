import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { BusinessHours } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** The device's IANA time zone, or null when the runtime cannot report one. */
export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Shifts a `YYYY-MM-DD` calendar string by whole days. */
export function shiftDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** The salon-local date of this week's Monday. */
export function salonMondayStr(now: Date, salonTz: string): string {
  const today = formatInTimeZone(now, salonTz, 'yyyy-MM-dd');
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return shiftDateStr(today, -((weekday + 6) % 7));
}

/**
 * The absolute instant of a salon-local date and minutes since midnight.
 * Accepts 1440 ("midnight at the end of the day") as the next day 00:00.
 */
export function salonInstant(dateStr: string, minutes: number, salonTz: string): Date {
  const dayOffset = Math.floor(minutes / 1440);
  const inDay = ((minutes % 1440) + 1440) % 1440;
  const time = `${pad(Math.floor(inDay / 60))}:${pad(inDay % 60)}:00`;
  return fromZonedTime(`${shiftDateStr(dateStr, dayOffset)}T${time}`, salonTz);
}

/** Weekday index in a time zone, using the project convention 0 = Monday … 6 = Sunday. */
export function weekdayIndexInTz(instant: Date, tz: string): number {
  return Number(formatInTimeZone(instant, tz, 'i')) - 1;
}

export interface VisitorHoursRow {
  /** Salon weekday that the row describes (0 = Monday … 6 = Sunday). */
  dayIndex: number;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  /** The closing time falls on the following day in the visitor's zone. */
  closeNextDay: boolean;
}

/**
 * Converts the salon's weekly opening hours into the visitor's time zone.
 *
 * The salon schedule is the source of truth and always interpreted in
 * `salonTz`; only the displayed clock times move to `visitorTz`. Rows stay
 * keyed by the salon's weekday (its business day), so the list keeps the same
 * seven entries. A closing time that crosses midnight in the visitor's zone is
 * flagged so the list cannot be misread as ending on the same day.
 */
export function visitorBusinessHours(
  hours: readonly BusinessHours[],
  now: Date,
  salonTz: string,
  visitorTz: string,
): VisitorHoursRow[] {
  const monday = salonMondayStr(now, salonTz);

  return hours
    .map((entry): VisitorHoursRow => {
      const date = shiftDateStr(monday, entry.dayOfWeek);

      if (entry.isClosed) {
        return {
          dayIndex: entry.dayOfWeek,
          isClosed: true,
          openTime: null,
          closeTime: null,
          closeNextDay: false,
        };
      }

      const openAt = salonInstant(date, entry.openMinutes, salonTz);
      const closeAt = salonInstant(date, entry.closeMinutes, salonTz);
      const openDay = formatInTimeZone(openAt, visitorTz, 'yyyy-MM-dd');
      const closeDay = formatInTimeZone(closeAt, visitorTz, 'yyyy-MM-dd');

      return {
        dayIndex: entry.dayOfWeek,
        isClosed: false,
        openTime: formatInTimeZone(openAt, visitorTz, 'HH:mm'),
        closeTime: formatInTimeZone(closeAt, visitorTz, 'HH:mm'),
        closeNextDay: openDay !== closeDay,
      };
    })
    .sort((a, b) => a.dayIndex - b.dayIndex);
}
