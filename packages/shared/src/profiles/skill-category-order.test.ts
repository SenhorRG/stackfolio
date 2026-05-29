import { describe, expect, it } from 'vitest';
import {
  collectProfileSkillDisplayCategories,
  mergeSkillCategoryOrder,
  sortLabelsByCategoryOrder,
} from './skill-category-order';

describe('mergeSkillCategoryOrder', () => {
  it('preserves saved order and appends new categories alphabetically', () => {
    expect(
      mergeSkillCategoryOrder(
        ['Frontend', 'Backend'],
        ['Backend', 'DevOps', 'Frontend'],
      ),
    ).toEqual(['Frontend', 'Backend', 'DevOps']);
  });

  it('prepends Core Stack when it is newly active', () => {
    expect(
      mergeSkillCategoryOrder(
        ['Frontend', 'Backend'],
        ['Backend', 'Core Stack', 'Frontend'],
      ),
    ).toEqual(['Core Stack', 'Frontend', 'Backend']);
  });
});

describe('sortLabelsByCategoryOrder', () => {
  it('orders labels using profile skillCategoryOrder', () => {
    expect(
      sortLabelsByCategoryOrder(
        ['Backend', 'Frontend', 'DevOps'],
        ['DevOps', 'Frontend', 'Backend'],
      ),
    ).toEqual(['DevOps', 'Frontend', 'Backend']);
  });
});

describe('collectProfileSkillDisplayCategories', () => {
  it('returns unique display categories sorted alphabetically', () => {
    expect(
      collectProfileSkillDisplayCategories([
        {
          displayCategory: 'backend',
          skill: { name: 'Node.js', category: 'backend', categories: ['backend'] },
        },
        {
          displayCategory: null,
          skill: { name: 'React', category: 'frontend', categories: ['frontend'] },
        },
      ]),
    ).toEqual(['Backend', 'Frontend']);
  });

  it('includes Core Stack when a skill is highlighted', () => {
    expect(
      collectProfileSkillDisplayCategories([
        {
          highlight: true,
          displayCategory: 'backend',
          skill: { name: 'Node.js', category: 'backend', categories: ['backend'] },
        },
        {
          highlight: false,
          displayCategory: null,
          skill: { name: 'React', category: 'frontend', categories: ['frontend'] },
        },
      ]),
    ).toEqual(['Backend', 'Core Stack', 'Frontend']);
  });
});
