import { ApiError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  token?: string,
): Promise<T> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(
      res.status,
      `${res.status} ${text || res.statusText}`.trim(),
    );
  }
  return res.json() as Promise<T>;
}
