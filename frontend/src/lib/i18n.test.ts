import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, LANGUAGES, translate } from './i18n';

describe('i18n', () => {
  it('defaults to Swedish and supports English', () => {
    expect(DEFAULT_LANGUAGE).toBe('sv');
    expect(LANGUAGES).toEqual(['sv', 'en']);
  });

  it('translates keys per language', () => {
    expect(translate('sv', 'nav.home')).toBe('Hem');
    expect(translate('en', 'nav.home')).toBe('Home');
    expect(translate('sv', 'privacy.title')).toBe('Integritetspolicy');
    expect(translate('en', 'privacy.title')).toBe('Privacy policy');
  });

  it('interpolates parameters', () => {
    expect(translate('sv', 'services.duration', { n: 45 })).toBe('45 min');
    expect(translate('en', 'services.duration', { n: 60 })).toBe('60 min');
  });

  it('returns the key itself when no translation exists', () => {
    expect(translate('sv', 'no.such.key')).toBe('no.such.key');
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });

  it('maps weekday indices (0 = Monday)', () => {
    expect(translate('sv', 'day.0')).toBe('Måndag');
    expect(translate('sv', 'day.6')).toBe('Söndag');
    expect(translate('en', 'day.0')).toBe('Monday');
    expect(translate('en', 'day.6')).toBe('Sunday');
  });
});