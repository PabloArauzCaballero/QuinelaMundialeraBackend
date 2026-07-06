import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from './models/role.model';
import { UserModel } from './models/user.model';
import { UserRoleModel } from './models/user-role.model';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserModel) private readonly users: typeof UserModel,
    @InjectModel(RoleModel) private readonly roles: typeof RoleModel,
    @InjectModel(UserRoleModel) private readonly userRoles: typeof UserRoleModel
  ) {}

  findById(id: string): Promise<UserModel | null> {
    return this.users.findByPk(id, { include: [RoleModel] });
  }

  findByEmail(email: string): Promise<UserModel | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() }, include: [RoleModel] });
  }

  create(input: { name: string; email: string; passwordHash: string }): Promise<UserModel> {
    return this.users.create({ ...input, email: input.email.toLowerCase() } as any);
  }

  async assignRole(userId: string, roleName: 'user' | 'admin'): Promise<void> {
    // Los roles base son catálogo obligatorio del sistema, no datos demo.
    // Se usa findOrCreate como defensa operativa si una base fue migrada antes
    // de incorporar la migración 006 o si alguien olvidó ejecutar seeders.
    const [role] = await this.roles.findOrCreate({
      where: { name: roleName },
      defaults: { name: roleName } as any
    });

    await this.userRoles.findOrCreate({ where: { userId, roleId: role.id } as any });
  }

  async updateProfile(userId: string, input: { name?: string; email?: string }): Promise<UserModel | null> {
    const user = await this.users.findByPk(userId);
    if (!user) return null;
    await user.update({ ...input, email: input.email?.toLowerCase() } as any);
    return this.findById(userId);
  }
}
