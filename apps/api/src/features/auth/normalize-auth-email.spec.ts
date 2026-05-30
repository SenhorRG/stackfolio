import { normalizeAuthEmail } from './normalize-auth-email';

describe('normalizeAuthEmail', () => {
  it('trims and lowercases email', () => {
    expect(normalizeAuthEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});
