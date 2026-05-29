import { describe, expect, it } from 'vitest';
import { emptyProfileIdentity } from '../entities/profile-identity';
import { resolveProfilePersonName } from './resolve-profile-person-name';

describe('resolveProfilePersonName', () => {
  it('prefers identity.fullName over profile label', () => {
    expect(
      resolveProfilePersonName({
        name: 'Profile de backend 1',
        identity: { ...emptyProfileIdentity(), fullName: 'Ricardo Macagnan' },
      }),
    ).toBe('Ricardo Macagnan');
  });

  it('falls back to profile name when fullName is empty', () => {
    expect(
      resolveProfilePersonName({
        name: 'Legacy Profile',
        identity: emptyProfileIdentity(),
      }),
    ).toBe('Legacy Profile');
  });
});
