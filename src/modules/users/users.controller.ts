import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../../common/types/request-user.type';
import { UsersService } from './users.service';
import { updateMyProfileSchema, type UpdateMyProfileInput } from './user.schemas';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Consultar perfil del usuario autenticado' })
  me(@CurrentUser() user: RequestUser) {
    return this.users.getSafeById(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Modificar información personal del usuario autenticado' })
  updateMe(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(updateMyProfileSchema)) body: UpdateMyProfileInput
  ) {
    return this.users.updateMyProfile(user.userId, body);
  }
}
