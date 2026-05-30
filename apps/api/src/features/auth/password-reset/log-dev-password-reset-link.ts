import { buildPasswordResetUrl } from './build-password-reset-url';
import { shouldExposeDevPasswordResetLink } from './should-expose-dev-password-reset-link';

export function logDevPasswordResetLink(
  email: string,
  rawToken: string,
  webUrl: string,
): void {
  if (!shouldExposeDevPasswordResetLink()) {
    return;
  }
  const link = buildPasswordResetUrl(webUrl, rawToken);
  console.log(`[dev] Password reset link for ${email}: ${link}`);
}
