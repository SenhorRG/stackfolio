import { describe, expect, it } from 'vitest';
import { parseSkillResourceCategories } from './parse-skill-resource-categories';

describe('parseSkillResourceCategories', () => {
  it('returns trimmed string categories from resources json', () => {
    expect(
      parseSkillResourceCategories({
        categories: ['backend', 'LLM'],
      }),
    ).toEqual(['backend', 'LLM']);
  });

  it('returns empty array for invalid resources', () => {
    expect(parseSkillResourceCategories(null)).toEqual([]);
    expect(parseSkillResourceCategories({ categories: 'backend' })).toEqual([]);
  });
});
