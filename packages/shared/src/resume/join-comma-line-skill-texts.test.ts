import { describe, expect, it } from 'vitest';
import { joinCommaLineSkillTexts } from './join-comma-line-skill-texts';

describe('joinCommaLineSkillTexts', () => {
  it('joins skills with comma separators', () => {
    expect(joinCommaLineSkillTexts(['Node.js', 'TypeScript'])).toBe(
      'Node.js, TypeScript',
    );
  });

  it('appends trailing comma when the line continues on the next row', () => {
    expect(
      joinCommaLineSkillTexts(['Node.js', 'TypeScript'], { trailingComma: true }),
    ).toBe('Node.js, TypeScript,');
  });
});
