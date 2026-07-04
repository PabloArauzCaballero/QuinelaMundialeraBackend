import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { groupIdParamSchema, uuidParamSchema } from '../../common/schemas/common.schemas';
import type { RequestUser } from '../../common/types/request-user.type';
import { PredictionsService } from './predictions.service';
import { createPredictionSchema, updatePredictionSchema, type CreatePredictionInput, type UpdatePredictionInput } from './prediction.schemas';

type RequestWithId = Request & { requestId?: string };

@ApiTags('Pronósticos')
@ApiBearerAuth()
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictions: PredictionsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar pronóstico antes del inicio del partido' })
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createPredictionSchema)) body: CreatePredictionInput,
    @Req() req: RequestWithId
  ) {
    return this.predictions.create(user.userId, body, req.requestId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modificar pronóstico antes del inicio del partido' })
  update(
    @CurrentUser() user: RequestUser,
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updatePredictionSchema)) body: UpdatePredictionInput,
    @Req() req: RequestWithId
  ) {
    return this.predictions.update(user.userId, params.id, body, req.requestId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Consultar todos mis pronósticos' })
  mine(@CurrentUser() user: RequestUser) {
    return this.predictions.listMine(user.userId);
  }

  @Get('me/groups/:groupId')
  @ApiOperation({ summary: 'Consultar mis pronósticos dentro del contexto de un grupo' })
  mineByGroup(@CurrentUser() user: RequestUser, @Param(new ZodValidationPipe(groupIdParamSchema)) params: { groupId: string }) {
    return this.predictions.listMineByGroup(user.userId, params.groupId);
  }
}
