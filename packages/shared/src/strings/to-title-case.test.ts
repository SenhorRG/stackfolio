import { describe, expect, it } from 'vitest';
import { toTitleCase } from './to-title-case';

describe('toTitleCase', () => {
  it('capitalizes each word', () => {
    expect(toTitleCase('backend development')).toBe('Backend Development');
    expect(toTitleCase('  cloud   native  ')).toBe('Cloud Native');
  });
});
