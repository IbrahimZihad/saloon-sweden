import { describe, expect, it } from 'vitest';
import { fillLegalDocument, legalDocuments, legalPlaceholders } from './legal';
import type { PublicSettings } from './types';

const settings = {
  salonName: 'Salong Test',
  address: 'Storgatan 1',
  postalCode: '123 45',
  city: 'Stockholm',
  country: 'Sweden',
  email: 'hej@test.se',
  phone: '+46 8 000 00 00',
} as unknown as PublicSettings;

describe('legalPlaceholders', () => {
  it('builds the controller and contact details from the public settings', () => {
    const values = legalPlaceholders(settings, 'sv');
    expect(values.controller).toBe('Salong Test, Storgatan 1, 123 45 Stockholm, Sverige');
    expect(values.contact).toBe('hej@test.se eller +46 8 000 00 00');
  });

  it('falls back to generic wording when settings are unavailable', () => {
    const values = legalPlaceholders(null, 'en');
    expect(values.controller).toBe('The salon');
    expect(values.contact).toBe('the contact details shown on the website');
  });

  it('omits the organisation number line when it is not configured', () => {
    expect(legalPlaceholders(settings, 'en').orgNumberLine).toBe('');
  });
});

describe('fillLegalDocument', () => {
  it('replaces every placeholder and drops empty paragraphs', () => {
    const doc = fillLegalDocument(
      legalDocuments.privacy.en,
      legalPlaceholders(settings, 'en'),
    );
    const text = doc.sections.flatMap((section) => section.paragraphs).join(' ');

    expect(text).not.toContain('{{');
    expect(text).toContain('Salong Test, Storgatan 1, 123 45 Stockholm, Sweden');
    expect(text).toContain('hej@test.se or +46 8 000 00 00');
    expect(text).not.toContain('Organisation number');
  });

  it('keeps the terms untouched by privacy placeholders', () => {
    const terms = legalDocuments.terms.sv;
    const doc = fillLegalDocument(terms, legalPlaceholders(settings, 'sv'));
    expect(doc.sections).toEqual(terms.sections);
  });
});
