import { compare, hash } from 'bcryptjs';

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  if (!passwordHash.startsWith('$2')) {
    return false;
  }
  try {
    return await compare(plain, passwordHash);
  } catch {
    return false;
  }
}
