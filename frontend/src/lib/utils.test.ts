import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins truthy class names with spaces', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b');
  });

  it('flattens nested arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
    expect(cn(['a', ['b', 'c']])).toBe('a b c');
  });

  it('returns an empty string for no inputs', () => {
    expect(cn()).toBe('');
    expect(cn(false, null, undefined)).toBe('');
  });

  it('stringifies numbers', () => {
    expect(cn('x', 5)).toBe('x 5');
  });
});