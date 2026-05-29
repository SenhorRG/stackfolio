import jwt from 'jsonwebtoken';

export function signApiToken(payload: { sub: string; email?: string }) {
  const secret = process.env.AUTH_SECRET ?? 'dev-secret-change-me';
  return jwt.sign(
    { sub: payload.sub, email: payload.email },
    secret,
    { expiresIn: '7d' },
  );
}
