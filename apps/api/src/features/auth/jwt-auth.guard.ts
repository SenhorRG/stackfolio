import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    try {
      const token = auth.slice(7);
      const payload = this.jwtService.verify<{ sub: string; email?: string }>(
        token,
        { secret: process.env.AUTH_SECRET ?? 'dev-secret-change-me' },
      );
      (request as Request & { user: { userId: string } }).user = {
        userId: payload.sub,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
