export function buildPasswordResetUrl(webUrl: string, rawToken: string): string {
  const base = webUrl.replace(/\/$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}
