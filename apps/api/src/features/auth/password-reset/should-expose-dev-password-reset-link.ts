export function shouldExposeDevPasswordResetLink(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (process.env.DEV_EXPOSE_PASSWORD_RESET_LINK === 'false') {
    return false;
  }
  return true;
}
