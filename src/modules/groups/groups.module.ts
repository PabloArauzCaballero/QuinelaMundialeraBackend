import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditModule } from '../audit/audit.module';
import { GroupRepository } from './group.repository';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupMemberModel } from './models/group-member.model';
import { GroupModel } from './models/group.model';

@Module({
  imports: [SequelizeModule.forFeature([GroupModel, GroupMemberModel]), AuditModule],
  controllers: [GroupsController],
  providers: [GroupRepository, GroupsService],
  exports: [GroupRepository, GroupsService]
})
export class GroupsModule {}
