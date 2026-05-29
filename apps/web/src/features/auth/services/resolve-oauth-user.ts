import type { AuthUser } from './auth-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function resolveOAuthUser(input: {
  email: string;
  name?: string | null;
}): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/auth/oauth-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      name: input.name ?? undefined,
    }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<AuthUser>;
}
