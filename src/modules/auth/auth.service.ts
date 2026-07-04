import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { conflict, unauthorized } from '../../common/errors/app-error';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { AuditService } from '../audit/audit.service';
import { UserRepository } from '../users/user.repository';
import { mapUser } from '../users/user.mapper';
import type { LoginInput, RegisterInput } from './auth.schemas';

// PENDIENTE_ATLAS: confirmar si el MVP requiere refresh token, revocación o versión de sesión.
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<Env, true>
  ) {}

  async register(input: RegisterInput, requestId?: string) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw conflict('El correo ya está registrado.');

    const passwordHash = await hashPassword(input.password);
    const created = await this.users.create({ name: input.name, email: input.email, passwordHash });
    await this.users.assignRole(created.id, 'user');
    const user = await this.users.findById(created.id);
    if (!user) throw unauthorized('No se pudo crear la sesión.');

    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.register',
      resourceType: 'user',
      resourceId: user.id,
      requestId
    });

    return this.buildAuthResponse(user);
  }

  async login(input: LoginInput, requestId?: string) {
    const user = await this.users.findByEmail(input.email);
    if (!user || user.status !== 'active') throw unauthorized('Credenciales inválidas.');

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      await this.audit.record({
        action: 'auth.login_failed',
        resourceType: 'user',
        metadata: { email: input.email.toLowerCase() },
        requestId
      });
      throw unauthorized('Credenciales inválidas.');
    }

    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.login_success',
      resourceType: 'user',
      resourceId: user.id,
      requestId
    });

    return this.buildAuthResponse(user);
  }

  logout(userId: string, requestId?: string) {
    return this.audit.record({ actorUserId: userId, action: 'auth.logout', resourceType: 'user', resourceId: userId, requestId }).then(() => ({ ok: true }));
  }

  private buildAuthResponse(user: Awaited<ReturnType<UserRepository['findById']>>) {
    if (!user) throw unauthorized('No se pudo crear la sesión.');
    const safeUser = mapUser(user);
    const accessToken = this.jwt.sign(
      { sub: safeUser.id, email: safeUser.email, roles: safeUser.roles },
      { secret: this.config.get('JWT_SECRET', { infer: true }), expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }) }
    );
    return { accessToken, tokenType: 'Bearer', expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }), user: safeUser };
  }
}
