import { describe, expect, it } from 'vitest';
import { detailsSchema } from './booking-schema';

const valid = {
  fullName: 'Anna Andersson',
  email: 'anna@example.com',
  phone: '+46 70 123 45 67',
  notes: '',
  consent: true,
};

describe('detailsSchema', () => {
  it('accepts a valid submission', () => {
    expect(detailsSchema.safeParse(valid).success).toBe(true);
  });

  it('trims whitespace from the name and email', () => {
    const result = detailsSchema.safeParse({ ...valid, fullName: '  Anna  ', email: '  anna@example.com  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('Anna');
      expect(result.data.email).toBe('anna@example.com');
    }
  });

  it('allows notes to be omitted', () => {
    const { notes, ...withoutNotes } = valid;
    expect(detailsSchema.safeParse(withoutNotes).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(detailsSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a name shorter than 2 characters', () => {
    expect(detailsSchema.safeParse({ ...valid, fullName: 'A' }).success).toBe(false);
  });

  it('rejects an invalid phone number', () => {
    expect(detailsSchema.safeParse({ ...valid, phone: 'abc123' }).success).toBe(false);
  });

  it('requires consent to be exactly true', () => {
    expect(detailsSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    const { consent, ...withoutConsent } = valid;
    expect(detailsSchema.safeParse(withoutConsent).success).toBe(false);
  });
});