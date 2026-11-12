import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../database/enums';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  staffId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | unknown => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? request.user?.[data] : request.user;
  },
);