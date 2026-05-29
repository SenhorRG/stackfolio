import {
  collectUniqueCategories,
  isValidSkillCategory,
  pickPrimaryCategory,
} from './skill-category';

describe('skill-category', () => {
  it('rejects injection-like and opaque ids', () => {
    expect(isValidSkillCategory('$_POST')).toBe(false);
    expect(isValidSkillCategory('$eq')).toBe(false);
    expect(isValidSkillCategory('507f1f77bcf86cd799439011')).toBe(false);
    expect(
      isValidSkillCategory('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ).toBe(false);
    expect(
      isValidSkillCategory('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    ).toBe(false);
  });

  it('accepts normal labels', () => {
    expect(isValidSkillCategory('frontend')).toBe(true);
    expect(isValidSkillCategory('language')).toBe(true);
    expect(isValidSkillCategory('Type Checkers')).toBe(true);
  });

  it('collects unique categories case-insensitively', () => {
    expect(collectUniqueCategories(['Frontend', 'frontend', 'backend'])).toEqual(
      ['backend', 'Frontend'],
    );
  });

  it('picks first valid category or concept', () => {
    expect(pickPrimaryCategory(['$_POST', 'frontend'])).toBe('frontend');
    expect(pickPrimaryCategory(['$_POST'])).toBe('concept');
  });
});
