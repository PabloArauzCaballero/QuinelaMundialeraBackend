import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { groupIdParamSchema } from '../../common/schemas/common.schemas';
import type { RequestUser } from '../../common/types/request-user.type';
import { GroupsService } from './groups.service';
import { createGroupSchema, joinGroupSchema, type CreateGroupInput, type JoinGroupInput } from './group.schemas';

type RequestWithId = Request & { requestId?: string };

@ApiTags('Grupos')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear grupo de quiniela' })
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createGroupSchema)) body: CreateGroupInput,
    @Req() req: RequestWithId
  ) {
    return this.groups.create(user.userId, body, req.requestId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar grupos del usuario' })
  listMine(@CurrentUser() user: RequestUser) {
    return this.groups.listMine(user.userId);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Consultar detalle de un grupo al que pertenece el usuario' })
  getMine(@CurrentUser() user: RequestUser, @Param(new ZodValidationPipe(groupIdParamSchema)) params: { groupId: string }) {
    return this.groups.getMine(user.userId, params.groupId);
  }

  @Get(':groupId/invitation-code')
  @ApiOperation({ summary: 'Obtener código de invitación del grupo' })
  invitationCode(@CurrentUser() user: RequestUser, @Param(new ZodValidationPipe(groupIdParamSchema)) params: { groupId: string }) {
    return this.groups.getInvitationCode(user.userId, params.groupId);
  }

  @Post('join')
  @ApiOperation({ summary: 'Unirse a un grupo con código de invitación' })
  join(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(joinGroupSchema)) body: JoinGroupInput,
    @Req() req: RequestWithId
  ) {
    return this.groups.join(user.userId, body, req.requestId);
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: 'Listar participantes de un grupo' })
  members(@CurrentUser() user: RequestUser, @Param(new ZodValidationPipe(groupIdParamSchema)) params: { groupId: string }) {
    return this.groups.listMembers(user.userId, params.groupId);
  }
}
