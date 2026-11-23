import { describe, expect, it } from 'vitest';
import { filterBookableSlots, isSlotBookable, slotStartMs } from './slots';

const now = Date.parse('2026-11-23T14:39:00.000Z');

describe('isSlotBookable', () => {
  it('accepts a slot that starts later today', () => {
    expect(isSlotBookable({ startsAt: '2026-11-23T15:45:00.000Z' }, now)).toBe(true);
  });

  it('rejects a morning slot that has already passed', () => {
    expect(isSlotBookable({ startsAt: '2026-11-23T08:00:00.000Z' }, now)).toBe(false);
  });

  it('rejects a slot that starts exactly now', () => {
    expect(isSlotBookable({ startsAt: '2026-11-23T14:39:00.000Z' }, now)).toBe(false);
  });

  it('rejects an invalid timestamp instead of treating it as future', () => {
    expect(isSlotBookable({ startsAt: 'not-a-date' }, now)).toBe(false);
    expect(Number.isNaN(slotStartMs({ startsAt: 'not-a-date' }))).toBe(true);
  });
});

describe('filterBookableSlots', () => {
  const slots = [
    { startsAt: '2026-11-23T08:00:00.000Z', staffId: 'anna' },
    { startsAt: '2026-11-23T15:45:00.000Z', staffId: 'anna' },
    { startsAt: '2026-11-23T16:00:00.000Z', staffId: 'anna' },
  ];

  it('keeps only future slots', () => {
    expect(filterBookableSlots(slots, now).map((s) => s.startsAt)).toEqual([
      '2026-11-23T15:45:00.000Z',
      '2026-11-23T16:00:00.000Z',
    ]);
  });

  it('does not mutate the input list', () => {
    const copy = [...slots];
    filterBookableSlots(slots, now);
    expect(slots).toEqual(copy);
  });

  it('returns an empty list when the whole day is in the past', () => {
    expect(filterBookableSlots(slots, Date.parse('2026-11-24T00:00:00.000Z'))).toEqual([]);
  });
});
