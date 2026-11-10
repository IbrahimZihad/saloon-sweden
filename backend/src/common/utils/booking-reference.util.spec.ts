import { generateBookingReference } from './booking-reference.util';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const FORMAT = new RegExp(`^SLN-[${ALPHABET}]{8}$`);

describe('generateBookingReference', () => {
  it('produces the SLN-XXXXXXXX format', () => {
    expect(generateBookingReference()).toMatch(FORMAT);
  });

  it('is 12 characters long', () => {
    expect(generateBookingReference()).toHaveLength(12);
  });

  it('never uses ambiguous characters (0, 1, I, L, O) in the code', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateBookingReference().slice(4); // strip the "SLN-" prefix
      expect(code).not.toMatch(/[01ILO]/);
    }
  });

  it('is unique across a large sample', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      codes.add(generateBookingReference());
    }
    expect(codes.size).toBe(5000);
  });
});