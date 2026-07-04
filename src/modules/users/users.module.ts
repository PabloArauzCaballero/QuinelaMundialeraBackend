import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleModel } from './models/role.model';
import { UserModel } from './models/user.model';
import { UserRoleModel } from './models/user-role.model';
import { UserRepository } from './user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([UserModel, RoleModel, UserRoleModel])],
  controllers: [UsersController],
  providers: [UserRepository, UsersService],
  exports: [UserRepository, UsersService]
})
export class UsersModule {}
