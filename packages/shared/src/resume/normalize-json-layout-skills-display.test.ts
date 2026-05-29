import { describe, expect, it } from 'vitest';
import { normalizeJsonLayoutSkillsDisplay } from './skills-by-category';

describe('normalizeJsonLayoutSkillsDisplay', () => {
  it('migrates legacy tags display to comma on load', () => {
    const layout = {
      sections: {
        skills: { source: 'profile' as const, display: 'tags' },
      },
    };
    const normalized = normalizeJsonLayoutSkillsDisplay(layout);
    expect(normalized.sections?.skills?.display).toBe('comma');
  });

  it('leaves comma display unchanged', () => {
    const layout = {
      sections: {
        skills: { source: 'profile' as const, display: 'comma' },
      },
    };
    expect(normalizeJsonLayoutSkillsDisplay(layout)).toBe(layout);
  });
});
