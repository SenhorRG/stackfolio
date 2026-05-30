import { parseApiErrorMessage } from './parse-api-error-message';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type PasswordResetRequestResponse = {
  message: string;
  devResetUrl?: string;
};

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetRequestResponse> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, 'Could not request password reset'),
    );
  }
  return res.json() as Promise<PasswordResetRequestResponse>;
}
