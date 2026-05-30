import { parseApiErrorMessage } from './parse-api-error-message';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, 'Could not reset password'));
  }
  return res.json() as Promise<{ message: string }>;
}
