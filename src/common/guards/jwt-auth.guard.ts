import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { unauthorized } from '../errors/app-error';
import type { RequestUser } from '../types/request-user.type';
import type { Env } from '../../config/env.schema';
import { UserRepository } from '../../modules/users/user.repository';

interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
}

type RequestWithUser = Request & { user?: RequestUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly users: UserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);
    if (!token) throw unauthorized('Token no enviado.');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get('JWT_SECRET', { infer: true })
      });
      const user = await this.users.findById(payload.sub);
      if (!user || user.status !== 'active') throw unauthorized('Usuario inactivo o no encontrado.');

      request.user = {
        userId: user.id,
        email: user.email,
        roles: user.roles?.map((role) => role.name) ?? []
      };
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Usuario inactivo o no encontrado.') throw error;
      throw unauthorized('Token inválido o expirado.');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
