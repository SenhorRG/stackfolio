import { shouldExposeDevPasswordResetLink } from './should-expose-dev-password-reset-link';

describe('shouldExposeDevPasswordResetLink', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalExposeFlag = process.env.DEV_EXPOSE_PASSWORD_RESET_LINK;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalExposeFlag === undefined) {
      delete process.env.DEV_EXPOSE_PASSWORD_RESET_LINK;
    } else {
      process.env.DEV_EXPOSE_PASSWORD_RESET_LINK = originalExposeFlag;
    }
  });

  it('returns false in production', () => {
    process.env.NODE_ENV = 'production';
    expect(shouldExposeDevPasswordResetLink()).toBe(false);
  });

  it('returns true in development by default', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DEV_EXPOSE_PASSWORD_RESET_LINK;
    expect(shouldExposeDevPasswordResetLink()).toBe(true);
  });

  it('returns false when explicitly disabled', () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_EXPOSE_PASSWORD_RESET_LINK = 'false';
    expect(shouldExposeDevPasswordResetLink()).toBe(false);
  });
});
