import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SyncService } from './sync.service';

@ApiTags('Sincronización')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('run')
  @ApiOperation({ summary: 'Ejecutar sincronización manual de resultados del día' })
  run() {
    return this.sync.syncToday();
  }

  @Get('runs')
  @ApiOperation({ summary: 'Consultar últimas ejecuciones de sincronización' })
  runs() {
    return this.sync.listRuns();
  }
}
