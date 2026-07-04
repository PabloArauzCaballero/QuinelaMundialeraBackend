import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { groupIdParamSchema } from '../../common/schemas/common.schemas';
import type { RequestUser } from '../../common/types/request-user.type';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Clasificación')
@ApiBearerAuth()
@Controller('groups/:groupId')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Consultar clasificación actualizada del grupo' })
  byGroup(@CurrentUser() user: RequestUser, @Param(new ZodValidationPipe(groupIdParamSchema)) params: { groupId: string }) {
    return this.leaderboard.byGroup(user.userId, params.groupId);
  }

  @Get('my-position')
  @ApiOperation({ summary: 'Consultar mi posición dentro del grupo' })
  myPosition(@CurrentUser() user: RequestUser, @Param(new ZodValidationPipe(groupIdParamSchema)) params: { groupId: string }) {
    return this.leaderboard.myPosition(user.userId, params.groupId);
  }
}
