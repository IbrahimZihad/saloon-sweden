import { describe, expect, it } from 'vitest';
import type { BusinessHours } from './types';
import {
  salonInstant,
  salonMondayStr,
  shiftDateStr,
  visitorBusinessHours,
  weekdayIndexInTz,
} from './timezone';

// A winter Monday, so Europe/Stockholm is on CET (UTC+1).
const now = new Date('2026-11-23T12:00:00.000Z');

function hours(entries: Array<[number, number, number, boolean]>): BusinessHours[] {
  return entries.map(([dayOfWeek, openMinutes, closeMinutes, isClosed], i) => ({
    id: `h${i}`,
    dayOfWeek,
    openMinutes,
    closeMinutes,
    isClosed,
  }));
}

const week = hours([
  [0, 9 * 60, 18 * 60, false], // Monday
  [1, 9 * 60, 18 * 60, false],
  [2, 9 * 60, 18 * 60, false],
  [3, 9 * 60, 20 * 60, false], // Thursday
  [4, 9 * 60, 18 * 60, false],
  [5, 10 * 60, 16 * 60, false], // Saturday
  [6, 0, 0, true], // Sunday closed
]);

describe('shiftDateStr', () => {
  it('shifts across month and year boundaries', () => {
    expect(shiftDateStr('2026-11-23', 10)).toBe('2026-12-03');
    expect(shiftDateStr('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDateStr('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('salonMondayStr', () => {
  it('finds the Monday of the salon-local week', () => {
    expect(salonMondayStr(now, 'Europe/Stockholm')).toBe('2026-11-23');
    expect(salonMondayStr(new Date('2026-11-29T12:00:00Z'), 'Europe/Stockholm')).toBe('2026-11-23');
  });
});

describe('salonInstant', () => {
  it('converts salon-local wall time to an absolute instant', () => {
    expect(salonInstant('2026-11-23', 9 * 60, 'Europe/Stockholm').toISOString()).toBe(
      '2026-11-23T08:00:00.000Z',
    );
  });

  it('treats 1440 as midnight at the end of the day', () => {
    expect(salonInstant('2026-11-23', 1440, 'Europe/Stockholm').toISOString()).toBe(
      '2026-11-23T23:00:00.000Z',
    );
  });
});

describe('visitorBusinessHours', () => {
  it('keeps the same clock times for a visitor in the salon zone', () => {
    const rows = visitorBusinessHours(week, now, 'Europe/Stockholm', 'Europe/Stockholm');
    expect(rows[0]).toMatchObject({ dayIndex: 0, openTime: '09:00', closeTime: '18:00' });
    expect(rows[5]).toMatchObject({ dayIndex: 5, openTime: '10:00', closeTime: '16:00' });
    expect(rows[6]).toMatchObject({ dayIndex: 6, isClosed: true });
  });

  it('shows Dhaka visitors the equivalent times (+5 h in winter)', () => {
    const rows = visitorBusinessHours(week, now, 'Europe/Stockholm', 'Asia/Dhaka');
    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({
      dayIndex: 0,
      openTime: '14:00',
      closeTime: '23:00',
      closeNextDay: false,
    });
    // Thursday closes at 20:00 salon time = 01:00 Friday in Dhaka.
    expect(rows[3]).toMatchObject({
      dayIndex: 3,
      openTime: '14:00',
      closeTime: '01:00',
      closeNextDay: true,
    });
    expect(rows[6]).toMatchObject({ dayIndex: 6, isClosed: true });
  });

  it('shows New York visitors the equivalent times (-6 h in winter)', () => {
    const rows = visitorBusinessHours(week, now, 'Europe/Stockholm', 'America/New_York');
    expect(rows[0]).toMatchObject({ dayIndex: 0, openTime: '03:00', closeTime: '12:00' });
    expect(rows[5]).toMatchObject({ dayIndex: 5, openTime: '04:00', closeTime: '10:00' });
  });

  it('rotates weekday-local times when the zone is far ahead', () => {
    // Auckland is UTC+13 in November, i.e. +12 h from Stockholm.
    const rows = visitorBusinessHours(week, now, 'Europe/Stockholm', 'Pacific/Auckland');
    // Monday 09:00–18:00 Stockholm is Monday 21:00 – Tuesday 06:00 in Auckland.
    expect(rows[0]).toMatchObject({ dayIndex: 0, openTime: '21:00', closeTime: '06:00', closeNextDay: true });
    // Saturday 10:00–16:00 Stockholm is Saturday 22:00 – Sunday 04:00 there.
    expect(rows[5]).toMatchObject({ dayIndex: 5, openTime: '22:00', closeTime: '04:00', closeNextDay: true });
    expect(rows).toHaveLength(7);
    expect(rows.map((row) => row.dayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns rows sorted by the salon weekday', () => {
    const rows = visitorBusinessHours(week, now, 'Europe/Stockholm', 'Asia/Tokyo');
    const indices = rows.map((row) => row.dayIndex);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});

describe('weekdayIndexInTz', () => {
  it('uses Monday as zero', () => {
    expect(weekdayIndexInTz(new Date('2026-11-23T12:00:00Z'), 'UTC')).toBe(0);
    expect(weekdayIndexInTz(new Date('2026-11-29T12:00:00Z'), 'UTC')).toBe(6);
  });
});
