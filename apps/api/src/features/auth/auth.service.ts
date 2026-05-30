import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { randomBytes } from 'crypto';
import { normalizeAuthEmail } from './normalize-auth-email';
import { hashPassword, verifyPassword } from './password.util';

export type AuthUserDto = {
  id: string;
  email: string;
  name: string | null;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthUserDto> {
    const email = normalizeAuthEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);
    const name = dto.name?.trim() || email.split('@')[0];

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        passwordCredentialSet: true,
        name,
        settings: { create: {} },
        profiles: {
          create: {
            name: 'Main Profile',
            isMain: true,
          },
        },
      },
    });

    return { id: user.id, email: user.email, name: user.name };
  }

  async login(dto: LoginDto): Promise<AuthUserDto> {
    const email = normalizeAuthEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordCredentialSet) {
      throw new UnauthorizedException(
        'This account has no password yet. Use forgot password to set one, or sign in with GitHub.',
      );
    }

    const valid = await verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  async findOrCreateByEmail(
    email: string,
    name?: string,
  ): Promise<AuthUserDto> {
    const normalized = normalizeAuthEmail(email);
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      await this.prisma.userSettings.upsert({
        where: { userId: existing.id },
        create: { userId: existing.id },
        update: {},
      });
      return {
        id: existing.id,
        email: existing.email,
        name: existing.name,
      };
    }

    const passwordHash = await hashPassword(
      randomBytes(32).toString('hex'),
    );
    const user = await this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        passwordCredentialSet: false,
        name: name?.trim() || normalized.split('@')[0],
        settings: { create: {} },
        profiles: {
          create: {
            name: 'Main Profile',
            isMain: true,
          },
        },
      },
    });

    return { id: user.id, email: user.email, name: user.name };
  }
}
