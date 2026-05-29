import { describe, expect, it } from 'vitest';
import { slugifySkillName } from './slugify-skill-name';

describe('slugifySkillName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifySkillName('React Native')).toBe('react-native');
  });

  it('strips accents', () => {
    expect(slugifySkillName('São Paulo')).toBe('sao-paulo');
  });

  it('falls back when empty', () => {
    expect(slugifySkillName('---')).toBe('skill');
  });
});
