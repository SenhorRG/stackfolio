import { describe, expect, it } from 'vitest';
import { capitalizeFirstLetter } from './capitalize-first-letter';

describe('capitalizeFirstLetter', () => {
  it('uppercases only the first character', () => {
    expect(capitalizeFirstLetter('backend')).toBe('Backend');
    expect(capitalizeFirstLetter('API')).toBe('API');
    expect(capitalizeFirstLetter('LLM')).toBe('LLM');
    expect(capitalizeFirstLetter('aws lambda')).toBe('Aws lambda');
  });

  it('trims surrounding whitespace', () => {
    expect(capitalizeFirstLetter('  cloud  ')).toBe('Cloud');
  });
});
