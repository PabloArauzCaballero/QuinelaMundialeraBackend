import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SyncService } from './sync.service';
import { importLeagueEventsSchema, importWorldCupEventsSchema, type ImportLeagueEventsInput, type ImportWorldCupEventsInput } from './sync.schemas';

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


  @Post('import-league')
  @ApiOperation({ summary: 'Importar/actualizar partidos reales de una liga desde TheSportsDB' })
  importLeague(@Body(new ZodValidationPipe(importLeagueEventsSchema)) body: ImportLeagueEventsInput) {
    return this.sync.importLeagueEvents(body);
  }

  @Post('import-world-cup')
  @ApiOperation({ summary: 'Importar/actualizar partidos del Mundial desde TheSportsDB sin datos mock' })
  importWorldCup(@Body(new ZodValidationPipe(importWorldCupEventsSchema)) body: ImportWorldCupEventsInput) {
    return this.sync.importWorldCupEvents(body);
  }

  @Get('runs')
  @ApiOperation({ summary: 'Consultar últimas ejecuciones de sincronización' })
  runs() {
    return this.sync.listRuns();
  }
}
