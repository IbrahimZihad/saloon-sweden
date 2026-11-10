import {
  DEFAULT_TIMEZONE,
  addDaysToDateStr,
  assertDateOnly,
  ceilToInterval,
  intervalsOverlap,
  localDateStr,
  localTimeStr,
  minutesOfDayLocal,
  todayLocalStr,
  weekdayFromDateStr,
  zonedDateTimeToUtc,
} from './time.util';

describe('time.util', () => {
  it('defaults to Europe/Stockholm', () => {
    expect(DEFAULT_TIMEZONE).toBe('Europe/Stockholm');
  });

  describe('assertDateOnly', () => {
    it('accepts YYYY-MM-DD', () => {
      expect(assertDateOnly('2024-07-01')).toBe('2024-07-01');
    });
    it.each(['2024-7-1', '01-01-2024', '2024-07-01T00:00:00Z', 'not-a-date', ''])(
      'rejects %s',
      (value) => {
        expect(() => assertDateOnly(value)).toThrow(/Invalid date/);
      },
    );
  });

  describe('weekdayFromDateStr (0 = Monday … 6 = Sunday)', () => {
    it('maps a known Monday to 0', () => {
      expect(weekdayFromDateStr('2024-01-01')).toBe(0);
    });
    it('maps a known Saturday to 5', () => {
      expect(weekdayFromDateStr('2024-01-06')).toBe(5);
    });
    it('maps a known Sunday to 6', () => {
      expect(weekdayFromDateStr('2024-01-07')).toBe(6);
    });
  });

  describe('zonedDateTimeToUtc — DST correctness', () => {
    it('uses UTC+2 (CEST) in summer', () => {
      expect(zonedDateTimeToUtc('2024-07-01', 12 * 60).toISOString()).toBe(
        '2024-07-01T10:00:00.000Z',
      );
    });
    it('uses UTC+1 (CET) in winter', () => {
      expect(zonedDateTimeToUtc('2024-01-01', 12 * 60).toISOString()).toBe(
        '2024-01-01T11:00:00.000Z',
      );
    });
    it('handles the spring-forward gap (2024-03-31)', () => {
      // 00:30 UTC is still CET (+1) -> 01:30 local
      expect(localTimeStr(new Date('2024-03-31T00:30:00Z'))).toBe('01:30');
      // 01:30 UTC is already CEST (+2) -> 03:30 local (02:xx does not exist)
      expect(localTimeStr(new Date('2024-03-31T01:30:00Z'))).toBe('03:30');
    });
    it('handles the autumn fallback (2024-10-27)', () => {
      // 00:30 UTC is CEST (+2) -> 02:30 local
      expect(localTimeStr(new Date('2024-10-27T00:30:00Z'))).toBe('02:30');
      // 01:30 UTC is CET (+1) -> 02:30 local again (the repeated hour)
      expect(localTimeStr(new Date('2024-10-27T01:30:00Z'))).toBe('02:30');
    });
  });

  describe('local string round-trips', () => {
    it('recovers the local date and time from a UTC instant', () => {
      const instant = zonedDateTimeToUtc('2024-07-01', 12 * 60);
      expect(localDateStr(instant)).toBe('2024-07-01');
      expect(localTimeStr(instant)).toBe('12:00');
      expect(minutesOfDayLocal(instant)).toBe(720);
    });
    it('rolls the local date forward across midnight', () => {
      expect(todayLocalStr(DEFAULT_TIMEZONE, new Date('2024-07-01T22:30:00Z'))).toBe(
        '2024-07-02',
      );
    });
  });

  describe('addDaysToDateStr', () => {
    it('crosses a leap day', () => {
      expect(addDaysToDateStr('2024-02-28', 1)).toBe('2024-02-29');
    });
    it('crosses a year boundary', () => {
      expect(addDaysToDateStr('2024-12-31', 1)).toBe('2025-01-01');
    });
    it('supports negative offsets', () => {
      expect(addDaysToDateStr('2024-03-01', -1)).toBe('2024-02-29');
    });
  });

  describe('intervalsOverlap (half-open [start, end))', () => {
    const d = (iso: string) => new Date(iso);
    it('is false when intervals merely touch', () => {
      expect(
        intervalsOverlap(d('2024-07-01T10:00:00Z'), d('2024-07-01T11:00:00Z'), d('2024-07-01T11:00:00Z'), d('2024-07-01T12:00:00Z')),
      ).toBe(false);
    });
    it('is true on a partial overlap', () => {
      expect(
        intervalsOverlap(d('2024-07-01T10:00:00Z'), d('2024-07-01T11:00:00Z'), d('2024-07-01T10:30:00Z'), d('2024-07-01T11:30:00Z')),
      ).toBe(true);
    });
    it('is true when one interval contains the other', () => {
      expect(
        intervalsOverlap(d('2024-07-01T10:00:00Z'), d('2024-07-01T12:00:00Z'), d('2024-07-01T10:30:00Z'), d('2024-07-01T11:00:00Z')),
      ).toBe(true);
    });
    it('is false for disjoint intervals', () => {
      expect(
        intervalsOverlap(d('2024-07-01T10:00:00Z'), d('2024-07-01T11:00:00Z'), d('2024-07-01T12:00:00Z'), d('2024-07-01T13:00:00Z')),
      ).toBe(false);
    });
  });

  describe('ceilToInterval', () => {
    it('rounds up to the next 15-minute local boundary', () => {
      // 12:07 local (10:07 UTC) -> 12:15 local (10:15 UTC)
      expect(ceilToInterval(new Date('2024-07-01T10:07:00Z'), 15).toISOString()).toBe(
        '2024-07-01T10:15:00.000Z',
      );
    });
    it('leaves an exact boundary unchanged', () => {
      expect(ceilToInterval(new Date('2024-07-01T10:00:00Z'), 15).toISOString()).toBe(
        '2024-07-01T10:00:00.000Z',
      );
    });
  });
});