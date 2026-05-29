import { describe, expect, it } from 'vitest';
import type { ProfileResumeSource } from './layout-types';
import {
  buildSkillsCategoryGroups,
  enrichSkillItemsFromProfile,
  formatSkillCategoryLabel,
  profileSkillItems,
  resolveSkillDisplayCategory,
} from './skills-by-category';

describe('formatSkillCategoryLabel', () => {
  it('capitalizes only the first letter', () => {
    expect(formatSkillCategoryLabel('backend')).toBe('Backend');
    expect(formatSkillCategoryLabel('API')).toBe('API');
    expect(formatSkillCategoryLabel('LLM')).toBe('LLM');
    expect(formatSkillCategoryLabel('cloud native')).toBe('Cloud native');
  });
});

describe('resolveSkillDisplayCategory', () => {
  it('uses catalog category when display category is unset', () => {
    expect(
      resolveSkillDisplayCategory({
        name: 'Node.js',
        categories: ['backend'],
      }),
    ).toBe('Backend');
  });

  it('uses legacy category field when categories array is empty', () => {
    expect(
      resolveSkillDisplayCategory({
        name: 'Node.js',
        category: 'backend',
      }),
    ).toBe('Backend');
  });

  it('uses skill.resources.categories when categories array is empty', () => {
    expect(
      resolveSkillDisplayCategory({
        name: 'LangChain',
        resources: { categories: ['LLM'] },
      }),
    ).toBe('LLM');
  });

  it('matches chosen category to catalog case-insensitively', () => {
    expect(
      resolveSkillDisplayCategory({
        name: 'Node.js',
        category: 'Backend',
        categories: ['backend'],
      }),
    ).toBe('Backend');
  });

  it('falls back to Other only when no category data exists', () => {
    expect(resolveSkillDisplayCategory({ name: 'Mystery' })).toBe('Other');
  });
});

describe('profileSkillItems', () => {
  it('includes legacy skill.category in catalog categories', () => {
    const profile = {
      name: 'Dev',
      skills: [
        {
          level: 'senior',
          years: 5,
          highlight: false,
          displayCategory: null,
          skill: {
            name: 'PostgreSQL',
            slug: 'postgresql',
            category: 'database',
            categories: [],
          },
        },
      ],
    } satisfies ProfileResumeSource;

    const items = profileSkillItems(profile);
    expect(items[0]?.categories).toEqual(['database']);
    expect(resolveSkillDisplayCategory(items[0]!)).toBe('Database');
  });

  it('includes categories from skill.resources when categories array is empty', () => {
    const profile = {
      name: 'Dev',
      skills: [
        {
          level: 'senior',
          years: 5,
          highlight: false,
          displayCategory: null,
          skill: {
            name: 'LangChain',
            slug: 'langchain',
            category: '',
            categories: [],
            resources: { categories: ['LLM'] },
          },
        },
      ],
    } satisfies ProfileResumeSource;

    const items = profileSkillItems(profile);
    expect(items[0]?.categories).toEqual(['LLM']);
    expect(resolveSkillDisplayCategory(items[0]!)).toBe('LLM');
  });
});

describe('enrichSkillItemsFromProfile', () => {
  it('fills missing custom item categories from profile catalog', () => {
    const profile = {
      name: 'Dev',
      skills: [
        {
          level: 'senior',
          years: 5,
          highlight: false,
          displayCategory: 'backend',
          skill: {
            name: 'Node.js',
            slug: 'nodejs',
            category: 'backend',
            categories: ['backend'],
          },
        },
      ],
    } satisfies ProfileResumeSource;

    const enriched = enrichSkillItemsFromProfile(
      [{ name: 'Node.js', skillSlug: 'nodejs' }],
      profile,
    );

    expect(resolveSkillDisplayCategory(enriched[0]!)).toBe('Backend');
  });
});

describe('buildSkillsCategoryGroups', () => {
  it('groups custom resume items by resolved category', () => {
    const groups = buildSkillsCategoryGroups(
      [
        { name: 'Node.js', categories: ['backend'] },
        { name: 'React', category: 'frontend', categories: ['frontend'] },
      ],
      { display: 'comma' },
    );

    expect(groups.map((group) => group.key).sort()).toEqual(['Backend', 'Frontend']);
  });

  it('orders groups using profile skillCategoryOrder', () => {
    const groups = buildSkillsCategoryGroups(
      [
        { name: 'Node.js', categories: ['backend'] },
        { name: 'React', category: 'frontend', categories: ['frontend'] },
        { name: 'Docker', categories: ['devops'] },
      ],
      { display: 'comma' },
      ['Devops', 'Frontend', 'Backend'],
    );

    expect(groups.map((group) => group.key)).toEqual([
      'Devops',
      'Frontend',
      'Backend',
    ]);
  });

  it('duplicates highlighted skills into Core Stack', () => {
    const groups = buildSkillsCategoryGroups(
      [
        {
          name: 'Node.js',
          categories: ['backend'],
          highlight: true,
        },
        {
          name: 'React',
          category: 'frontend',
          categories: ['frontend'],
          highlight: false,
        },
      ],
      { display: 'comma' },
    );

    const coreStack = groups.find((group) => group.key === 'Core Stack');
    const backend = groups.find((group) => group.key === 'Backend');

    expect(coreStack?.skills.map((skill) => skill.name)).toEqual(['Node.js']);
    expect(backend?.skills.map((skill) => skill.name)).toEqual(['Node.js']);
    expect(groups.map((group) => group.key).sort()).toEqual([
      'Backend',
      'Core Stack',
      'Frontend',
    ]);
  });
});
