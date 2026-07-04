import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verificar estado básico de la API' })
  health() {
    return { ok: true, service: 'quiniela-mundial-2026-api', timestamp: new Date().toISOString() };
  }
}
