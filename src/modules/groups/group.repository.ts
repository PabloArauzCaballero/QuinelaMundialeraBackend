import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Transaction } from 'sequelize';
import { UserModel } from '../users/models/user.model';
import { GroupMemberModel } from './models/group-member.model';
import { GroupModel } from './models/group.model';

interface WriteOptions {
  transaction?: Transaction;
}

@Injectable()
export class GroupRepository {
  constructor(
    @InjectModel(GroupModel) private readonly groups: typeof GroupModel,
    @InjectModel(GroupMemberModel) private readonly members: typeof GroupMemberModel
  ) {}

  createGroup(input: { name: string; ownerUserId: string; invitationCode: string }, options: WriteOptions = {}): Promise<GroupModel> {
    return this.groups.create(input as any, { transaction: options.transaction });
  }

  createMember(input: { groupId: string; userId: string; role: 'owner' | 'member' }, options: WriteOptions = {}): Promise<GroupMemberModel> {
    return this.members.create(input as any, { transaction: options.transaction });
  }

  findGroupById(groupId: string): Promise<GroupModel | null> {
    return this.groups.findByPk(groupId);
  }

  findByInvitationCode(invitationCode: string): Promise<GroupModel | null> {
    return this.groups.findOne({ where: { invitationCode } });
  }

  findByInvitationCodeRaw(invitationCode: string): Promise<GroupModel | null> {
    return this.groups.findOne({ where: { invitationCode } });
  }

  findMembership(groupId: string, userId: string): Promise<GroupMemberModel | null> {
    return this.members.findOne({ where: { groupId, userId, status: 'active' } });
  }

  findGroupsByUser(userId: string): Promise<GroupModel[]> {
    return this.groups.findAll({
      include: [{ model: GroupMemberModel, where: { userId, status: 'active' }, required: true }],
      order: [['createdAt', 'DESC']]
    });
  }

  findMembers(groupId: string): Promise<GroupMemberModel[]> {
    return this.members.findAll({ where: { groupId, status: 'active' }, include: [UserModel], order: [['joinedAt', 'ASC']] });
  }
}
