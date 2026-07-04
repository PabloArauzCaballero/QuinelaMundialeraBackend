import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { conflict, forbidden, notFound } from '../../common/errors/app-error';
import { generateInvitationCode } from '../../common/utils/random-code.util';
import { AuditService } from '../audit/audit.service';
import { GroupRepository } from './group.repository';
import { mapGroup, mapMember } from './group.mapper';
import type { CreateGroupInput, JoinGroupInput } from './group.schemas';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groups: GroupRepository,
    private readonly sequelize: Sequelize,
    private readonly audit: AuditService
  ) {}

  async create(userId: string, input: CreateGroupInput, requestId?: string) {
    const invitationCode = await this.createUniqueInvitationCode();
    const group = await this.sequelize.transaction(async (transaction) => {
      const created = await this.groups.createGroup({ name: input.name, ownerUserId: userId, invitationCode }, { transaction });
      await this.groups.createMember({ groupId: created.id, userId, role: 'owner' }, { transaction });
      return created;
    });

    await this.audit.record({ actorUserId: userId, action: 'group.create', resourceType: 'group', resourceId: group.id, requestId });
    return mapGroup(group);
  }

  async listMine(userId: string) {
    const groups = await this.groups.findGroupsByUser(userId);
    return groups.map(mapGroup);
  }

  async getMine(userId: string, groupId: string) {
    await this.assertMember(groupId, userId);
    const group = await this.groups.findGroupById(groupId);
    if (!group) throw notFound('Grupo no encontrado.');
    return mapGroup(group);
  }

  async getInvitationCode(userId: string, groupId: string) {
    const group = await this.groups.findGroupById(groupId);
    if (!group) throw notFound('Grupo no encontrado.');
    if (group.ownerUserId !== userId) throw forbidden('Solo el dueño del grupo puede consultar el código de invitación.');
    return { groupId, invitationCode: group.invitationCode };
  }

  async join(userId: string, input: JoinGroupInput, requestId?: string) {
    const group = await this.groups.findByInvitationCode(input.invitationCode);
    if (!group) throw notFound('Código de invitación inválido.');
    const existing = await this.groups.findMembership(group.id, userId);
    if (existing) throw conflict('Ya perteneces a este grupo.');
    const member = await this.groups.createMember({ groupId: group.id, userId, role: 'member' });
    await this.audit.record({ actorUserId: userId, action: 'group.join', resourceType: 'group', resourceId: group.id, requestId });
    return { group: mapGroup(group), membershipId: member.id };
  }

  async listMembers(userId: string, groupId: string) {
    await this.assertMember(groupId, userId);
    const members = await this.groups.findMembers(groupId);
    return members.map(mapMember);
  }

  async assertMember(groupId: string, userId: string): Promise<void> {
    const membership = await this.groups.findMembership(groupId, userId);
    if (!membership) throw forbidden('No perteneces a este grupo.');
  }

  private async createUniqueInvitationCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateInvitationCode();
      const exists = await this.groups.findByInvitationCodeRaw(code);
      if (!exists) return code;
    }
    throw conflict('No se pudo generar un código de invitación único.');
  }
}
