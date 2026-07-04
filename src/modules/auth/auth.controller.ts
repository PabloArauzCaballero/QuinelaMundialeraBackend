import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../../common/types/request-user.type';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from './auth.schemas';

type RequestWithId = Request & { requestId?: string };

// PENDIENTE_ATLAS: agregar rate limiting para login/registro si se expone a internet.
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar visitante como usuario' })
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput, @Req() req: RequestWithId) {
    return this.auth.register(body, req.requestId);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con credenciales' })
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput, @Req() req: RequestWithId) {
    return this.auth.login(body, req.requestId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar usuario autenticado' })
  me(@CurrentUser() user: RequestUser) {
    return this.users.getSafeById(user.userId);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión lógica' })
  logout(@CurrentUser() user: RequestUser, @Req() req: RequestWithId) {
    return this.auth.logout(user.userId, req.requestId);
  }
}
