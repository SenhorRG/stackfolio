const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function registerAccount(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Registration failed');
  }
  return res.json() as Promise<AuthUser>;
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = 'Invalid email or password';
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (typeof data.message === 'string') {
        message = data.message;
      } else if (Array.isArray(data.message) && data.message[0]) {
        message = data.message[0];
      }
    } catch {
      // ignore parse errors
    }
    return Promise.reject(new Error(message));
  }
  return res.json() as Promise<AuthUser>;
}
