import { describe, expect, it } from 'vitest';
import { emptyProfileIdentity } from '../entities/profile-identity';
import { profileHasFilledData } from './profile-has-filled-data';

describe('profileHasFilledData', () => {
  it('is false for empty profile', () => {
    expect(
      profileHasFilledData({
        profileData: emptyProfileIdentity(),
        skillsCount: 0,
        parseIdentity: (d) => d as ReturnType<typeof emptyProfileIdentity>,
      }),
    ).toBe(false);
  });

  it('is true when skills exist', () => {
    expect(
      profileHasFilledData({
        profileData: emptyProfileIdentity(),
        skillsCount: 2,
        parseIdentity: (d) => d as ReturnType<typeof emptyProfileIdentity>,
      }),
    ).toBe(true);
  });

  it('is true when summary is set', () => {
    const identity = { ...emptyProfileIdentity(), summary: 'Builder' };
    expect(
      profileHasFilledData({
        profileData: identity,
        skillsCount: 0,
        parseIdentity: () => identity,
      }),
    ).toBe(true);
  });
});
