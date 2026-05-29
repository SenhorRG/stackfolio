import { describe, expect, it } from 'vitest';
import { formatSkillInline } from '../resume/skills-by-category';
import {
  filterHiddenSkillCategoriesToActive,
  filterVisibleSkillCategoryGroups,
  isSkillCategoryHidden,
  resolveSkillInlineFormatOptions,
  toggleHiddenSkillCategory,
} from './profile-skill-display-settings';

describe('resolveSkillInlineFormatOptions', () => {
  it('defaults to showing level and years', () => {
    expect(resolveSkillInlineFormatOptions({})).toEqual({
      showLevel: true,
      showYears: true,
    });
  });

  it('respects explicit false values', () => {
    expect(
      resolveSkillInlineFormatOptions({
        skillShowLevel: false,
        skillShowYears: false,
      }),
    ).toEqual({
      showLevel: false,
      showYears: false,
    });
  });
});

describe('formatSkillInline', () => {
  it('puts level and years together inside parentheses', () => {
    expect(
      formatSkillInline({
        name: 'AWS',
        level: 'intermediate',
        years: 2,
      }),
    ).toBe('AWS (intermediate, 2y)');
  });

  it('shows only level inside parentheses when years are hidden', () => {
    expect(
      formatSkillInline(
        { name: 'AWS', level: 'intermediate', years: 2 },
        { showYears: false },
      ),
    ).toBe('AWS (intermediate)');
  });

  it('shows only years inside parentheses when level is hidden', () => {
    expect(
      formatSkillInline(
        { name: 'AWS', level: 'intermediate', years: 2 },
        { showLevel: false },
      ),
    ).toBe('AWS (2y)');
  });

  it('omits level and years when disabled', () => {
    expect(
      formatSkillInline(
        { name: 'Node.js', level: 'advanced', years: 5 },
        { showLevel: false, showYears: false },
      ),
    ).toBe('Node.js');
  });
});

describe('hidden skill categories', () => {
  it('toggles category visibility', () => {
    expect(toggleHiddenSkillCategory(undefined, 'Backend')).toEqual([
      'Backend',
    ]);
    expect(
      toggleHiddenSkillCategory(['Backend'], 'Backend'),
    ).toEqual([]);
    expect(
      isSkillCategoryHidden('backend', ['Backend']),
    ).toBe(true);
  });

  it('filters hidden groups from resume output', () => {
    const groups = [
      {
        key: 'Backend',
        label: 'Backend',
        display: 'comma' as const,
        skills: [{ name: 'Node.js' }],
      },
      {
        key: 'Frontend',
        label: 'Frontend',
        display: 'comma' as const,
        skills: [{ name: 'React' }],
      },
    ];

    expect(
      filterVisibleSkillCategoryGroups(groups, ['Backend']).map(
        (group) => group.key,
      ),
    ).toEqual(['Frontend']);
  });

  it('drops hidden categories that are no longer active', () => {
    expect(
      filterHiddenSkillCategoriesToActive(['Backend', 'DevOps'], [
        'Backend',
        'Frontend',
      ]),
    ).toEqual(['Backend']);
  });
});
