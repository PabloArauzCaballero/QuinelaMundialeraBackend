import { Injectable } from '@nestjs/common';
import { conflict, notFound } from '../../common/errors/app-error';
import { UserRepository } from './user.repository';
import { mapUser, SafeUserResponse } from './user.mapper';
import type { UpdateMyProfileInput } from './user.schemas';

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async getSafeById(userId: string): Promise<SafeUserResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw notFound('Usuario no encontrado.');
    return mapUser(user);
  }

  async updateMyProfile(userId: string, input: UpdateMyProfileInput): Promise<SafeUserResponse> {
    if (input.email) {
      const existing = await this.users.findByEmail(input.email);
      if (existing && existing.id !== userId) throw conflict('El correo ya está registrado.');
    }
    const user = await this.users.updateProfile(userId, input);
    if (!user) throw notFound('Usuario no encontrado.');
    return mapUser(user);
  }
}
