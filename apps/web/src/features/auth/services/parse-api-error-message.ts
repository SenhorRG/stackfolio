export async function parseApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const text = await res.text();
  if (!text) {
    return fallback;
  }
  try {
    const data = JSON.parse(text) as { message?: string | string[] };
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (Array.isArray(data.message) && data.message[0]) {
      return data.message[0];
    }
  } catch {
    return text;
  }
  return fallback;
}
