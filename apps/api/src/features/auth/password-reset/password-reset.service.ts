import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { hashPassword } from '../password.util';
import { createRawResetToken } from './create-raw-reset-token';
import { hashResetToken } from './hash-reset-token';
import { buildPasswordResetUrl } from './build-password-reset-url';
import { logDevPasswordResetLink } from './log-dev-password-reset-link';
import { PASSWORD_RESET_TOKEN_EXPIRY_HOURS } from './password-reset-token-expiry-hours';
import { shouldExposeDevPasswordResetLink } from './should-expose-dev-password-reset-link';

export type PasswordResetRequestResult = {
  message: string;
  devResetUrl?: string;
};

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService) {}

  async requestReset(email: string): Promise<PasswordResetRequestResult> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      return {
        message:
          'If an account exists for this email, a reset link has been sent.',
      };
    }

    const rawToken = createRawResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    logDevPasswordResetLink(user.email, rawToken, webUrl);

    const result: PasswordResetRequestResult = {
      message:
        'If an account exists for this email, a reset link has been sent.',
    };

    if (shouldExposeDevPasswordResetLink()) {
      result.devResetUrl = buildPasswordResetUrl(webUrl, rawToken);
    }

    return result;
  }

  async resetPassword(
    rawToken: string,
    newPassword: string,
  ): Promise<PasswordResetRequestResult> {
    const token = rawToken.trim();
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    const tokenHash = hashResetToken(token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      }
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          passwordCredentialSet: true,
        },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    return { message: 'Password updated successfully' };
  }
}
