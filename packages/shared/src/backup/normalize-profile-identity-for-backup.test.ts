import { describe, expect, it } from 'vitest';
import { normalizeProfileIdentityForBackup } from './normalize-profile-identity-for-backup';

describe('normalizeProfileIdentityForBackup', () => {
  it('preserves profile settings when optional booleans are null in DB', () => {
    const result = normalizeProfileIdentityForBackup({
      fullName: 'Jane Doe',
      summary: 'Backend engineer',
      skillShowLevel: null,
      skillShowYears: null,
      hiddenSkillCategories: null,
      contact: {
        email: null,
        phone: null,
        location: 'Remote',
      },
    });

    expect(result.fullName).toBe('Jane Doe');
    expect(result.summary).toBe('Backend engineer');
    expect(result.contact.location).toBe('Remote');
    expect(result.skillShowLevel).toBeUndefined();
    expect(result.skillShowYears).toBeUndefined();
    expect(result.hiddenSkillCategories).toBeUndefined();
  });

  it('preserves explicit false booleans and category order', () => {
    const result = normalizeProfileIdentityForBackup({
      skillShowLevel: false,
      skillShowYears: true,
      skillCategoryOrder: ['backend', 'frontend'],
    });

    expect(result.skillShowLevel).toBe(false);
    expect(result.skillShowYears).toBe(true);
    expect(result.skillCategoryOrder).toEqual(['backend', 'frontend']);
  });
});
