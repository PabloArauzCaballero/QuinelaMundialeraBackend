import { GroupModel } from './models/group.model';
import { GroupMemberModel } from './models/group-member.model';

export function mapGroup(group: GroupModel) {
  return {
    id: group.id,
    name: group.name,
    invitationCode: group.invitationCode,
    ownerUserId: group.ownerUserId,
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  };
}

export function mapMember(member: GroupMemberModel) {
  return {
    id: member.id,
    groupId: member.groupId,
    userId: member.userId,
    name: member.user?.name,
    email: member.user?.email,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt
  };
}
