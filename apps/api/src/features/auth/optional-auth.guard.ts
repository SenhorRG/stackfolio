import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify<{ sub: string }>(auth.slice(7), {
          secret: process.env.AUTH_SECRET ?? 'dev-secret-change-me',
        });
        (request as Request & { user: { userId: string } }).user = {
          userId: payload.sub,
        };
      } catch {
        /* public read */
      }
    }
    return true;
  }
}
