import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { matchIdParamSchema } from '../../common/schemas/common.schemas';
import type { RequestUser } from '../../common/types/request-user.type';
import { MatchesService } from './matches.service';
import { createMatchSchema, listMatchesQuerySchema, updateMatchSchema, type CreateMatchInput, type ListMatchesQuery, type UpdateMatchInput } from './match.schemas';

type RequestWithId = Request & { requestId?: string };

@ApiTags('Partidos')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar calendario completo con filtros' })
  list(@Query(new ZodValidationPipe(listMatchesQuerySchema)) query: ListMatchesQuery) {
    return this.matches.list(query);
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Consultar detalle de partido y ciudad del estadio' })
  detail(@Param(new ZodValidationPipe(matchIdParamSchema)) params: { matchId: string }) {
    return this.matches.detail(params.matchId);
  }
}

@ApiTags('Administración de partidos')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/matches')
export class AdminMatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar partido como administrador' })
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createMatchSchema)) body: CreateMatchInput,
    @Req() req: RequestWithId
  ) {
    return this.matches.createAdmin(user.userId, body, req.requestId);
  }

  @Patch(':matchId')
  @ApiOperation({ summary: 'Modificar información de partido sin tocar resultado oficial' })
  update(
    @CurrentUser() user: RequestUser,
    @Param(new ZodValidationPipe(matchIdParamSchema)) params: { matchId: string },
    @Body(new ZodValidationPipe(updateMatchSchema)) body: UpdateMatchInput,
    @Req() req: RequestWithId
  ) {
    return this.matches.updateAdmin(user.userId, params.matchId, body, req.requestId);
  }
}
