import { randomBytes } from 'crypto';

// Unambiguous alphabet: no 0/O, 1/I/L.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateBookingReference(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `SLN-${code}`;
}