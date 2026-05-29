import { ApiError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(
      res.status,
      `${res.status} ${text || res.statusText}`.trim(),
    );
  }
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/pdf')) {
    return (await res.blob()) as T;
  }
  return res.json() as Promise<T>;
}

export async function apiFetchText(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<string> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(
      res.status,
      `${res.status} ${text || res.statusText}`.trim(),
    );
  }
  return res.text();
}

export function cvPreviewUrl(projectId: string) {
  return `${API_URL}/cv-preview/${projectId}`;
}
