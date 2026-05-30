import { hashResetToken } from './hash-reset-token';

describe('hashResetToken', () => {
  it('returns stable sha256 hex for the same token', () => {
    const a = hashResetToken('abc');
    const b = hashResetToken('abc');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
