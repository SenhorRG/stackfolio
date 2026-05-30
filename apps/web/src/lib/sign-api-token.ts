import jwt, { type SignOptions } from 'jsonwebtoken';

export function signApiToken(
  payload: { sub: string; email?: string },
  expiresIn: SignOptions['expiresIn'] = '7d',
) {
  const secret = process.env.AUTH_SECRET ?? 'dev-secret-change-me';
  const options: SignOptions = { expiresIn };
  return jwt.sign({ sub: payload.sub, email: payload.email }, secret, options);
}
