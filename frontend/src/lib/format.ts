import { formatInTimeZone } from 'date-fns-tz';
import { enGB, sv } from 'date-fns/locale';
import type { Language } from './types';

export const DEFAULT_TZ = 'Europe/Stockholm';

function locale(lang: Language) {
  return lang === 'sv' ? sv : enGB;
}

export function formatMoney(amount: string | number, lang: Language = 'sv'): string {
  const num = typeof amount === 'string' ? Number(amount) : amount;
  const formatted = new Intl.NumberFormat(lang === 'sv' ? 'sv-SE' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
  return `${formatted} ${lang === 'sv' ? 'kr' : 'SEK'}`;
}

export function formatDuration(minutes: number, lang: Language = 'sv'): string {
  return `${minutes} ${lang === 'sv' ? 'min' : 'min'}`;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatLocalDateTime(iso: string, tz: string, lang: Language = 'sv'): string {
  return formatInTimeZone(new Date(iso), tz, 'EEEE d MMMM yyyy · HH:mm', { locale: locale(lang) });
}

export function formatLocalDate(iso: string, tz: string, lang: Language = 'sv'): string {
  return formatInTimeZone(new Date(iso), tz, 'EEEE d MMMM yyyy', { locale: locale(lang) });
}

export function formatLocalTime(iso: string, tz: string, lang: Language = 'sv'): string {
  return formatInTimeZone(new Date(iso), tz, 'HH:mm', { locale: locale(lang) });
}

/** Format a YYYY-MM-DD local date string without timezone shifting. */
export function formatDateStr(dateStr: string, lang: Language = 'sv', pattern = 'EEEE d MMMM'): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(lang === 'sv' ? 'sv-SE' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatDateStrShort(dateStr: string, lang: Language = 'sv'): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(lang === 'sv' ? 'sv-SE' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}