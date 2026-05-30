import { hashPassword, verifyPassword } from './password.util';

describe('verifyPassword', () => {
  it('verifies bcrypt hashes', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('returns false for non-bcrypt hashes', async () => {
    expect(await verifyPassword('x', 'not-a-bcrypt-hash')).toBe(false);
  });
});
