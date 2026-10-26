import { CanActivate, ExecutionContext, Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { jwtSecret } from '../../modules/auth/session-cookie';
import { PrismaService } from '../../database/prisma.service';

/** Session token from the `token` cookie (signed or plain), else a Bearer header. */
export function extractToken(request: FastifyRequest): string | null {
  const cookieToken = request.cookies?.token;
  if (cookieToken) {
    const unsigned = request.unsignCookie?.(cookieToken);
    return unsigned?.valid && unsigned.value ? unsigned.value : cookieToken;
  }

  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

function verify(token: string, config: ConfigService): AuthenticatedUser {
  const user = jwt.verify(token, jwtSecret(config), { algorithms: ['HS256'] }) as AuthenticatedUser;
  if (!user || typeof user.id !== 'string' || typeof user.githubId !== 'string') throw new Error('Invalid identity');
  return user;
}

/** Rejects the request unless it carries a valid session. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    let identity: AuthenticatedUser;
    try {
      identity = verify(token, this.configService);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication session');
    }
    const user = await this.prisma.user.findUnique({ where: { id: identity.id }, select: { id: true, githubId: true, username: true } });
    if (!user || user.githubId !== identity.githubId) throw new UnauthorizedException('Account no longer exists');
    request.user = { ...identity, ...user };
    return true;
  }
}

/** Attaches the user when a valid session is present; never rejects. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = extractToken(request);
    if (token) {
      try {
        const identity = verify(token, this.configService);
        const user = await this.prisma.user.findUnique({ where: { id: identity.id }, select: { id: true, githubId: true, username: true } });
        if (user && user.githubId === identity.githubId) request.user = { ...identity, ...user };
      } catch {
        // Invalid tokens are treated as anonymous
      }
    }
    return true;
  }
}
