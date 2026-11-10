import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TZ,
  formatDateStr,
  formatDateStrShort,
  formatDuration,
  formatLocalTime,
  formatMoney,
  minutesToTime,
} from './format';

const spaces = (s: string) => s.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('formats SEK in Swedish', () => {
    expect(formatMoney(650, 'sv')).toBe('650 kr');
  });
  it('uses a comma decimal in Swedish', () => {
    expect(formatMoney('400.50', 'sv')).toBe('400,5 kr');
  });
  it('uses a point decimal and SEK label in English', () => {
    expect(formatMoney(400.5, 'en')).toBe('400.5 SEK');
  });
  it('groups thousands with a space', () => {
    expect(spaces(formatMoney(1500, 'sv'))).toBe('1 500 kr');
  });
  it('falls back to 0 for non-numeric input', () => {
    expect(formatMoney('abc', 'sv')).toBe('0 kr');
    expect(formatMoney(Number.NaN, 'en')).toBe('0 SEK');
  });
});

describe('minutesToTime (24h clock)', () => {
  it.each([
    [0, '00:00'],
    [540, '09:00'],
    [75, '01:15'],
    [1080, '18:00'],
    [1439, '23:59'],
  ])('converts %i minutes to %s', (minutes, expected) => {
    expect(minutesToTime(minutes)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it('labels minutes in both languages', () => {
    expect(formatDuration(60, 'sv')).toBe('60 min');
    expect(formatDuration(60, 'en')).toBe('60 min');
  });
});

describe('formatLocalTime — DST correctness', () => {
  it('renders summer time as UTC+2', () => {
    expect(formatLocalTime('2024-07-01T10:00:00Z', DEFAULT_TZ)).toBe('12:00');
  });
  it('renders winter time as UTC+1', () => {
    expect(formatLocalTime('2024-01-01T11:00:00Z', DEFAULT_TZ)).toBe('12:00');
  });
});

describe('formatDateStr (no timezone shifting)', () => {
  it('formats a local date in English', () => {
    expect(formatDateStr('2024-01-01', 'en')).toBe('Monday 1 January');
  });
  it('formats a local date in Swedish', () => {
    expect(formatDateStr('2024-01-01', 'sv')).toBe('måndag 1 januari');
  });
  it('formats a short date', () => {
    expect(formatDateStrShort('2024-01-01', 'en')).toBe('1 Jan');
  });
});