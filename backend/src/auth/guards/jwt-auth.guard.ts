import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../decorators/current-user.decorator';

export const AUTH_COOKIE = 'salon_token';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { staffMember: { select: { id: true } } },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffId: user.staffMember?.id,
    };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookieToken = (request.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
    if (cookieToken) return cookieToken;
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return undefined;
  }
}