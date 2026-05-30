import { randomBytes } from 'crypto';

export function createRawResetToken(): string {
  return randomBytes(32).toString('hex');
}
