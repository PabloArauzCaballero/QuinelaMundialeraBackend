import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SportsDbService } from './sportsdb.service';
import { listSportsDbEventsQuerySchema, listSportsDbLeaguesQuerySchema, listWorldCupEventsQuerySchema, type ListSportsDbEventsQuery, type ListSportsDbLeaguesQuery, type ListWorldCupEventsQuery } from './sportsdb.schemas';

@ApiTags('TheSportsDB')
@ApiBearerAuth()
@Controller('sportsdb')
export class SportsDbController {
  constructor(private readonly sportsDb: SportsDbService) {}

  @Get('sports')
  @ApiOperation({ summary: 'Listar deportes disponibles en TheSportsDB según el plan configurado' })
  sports() {
    return this.sportsDb.listSports();
  }

  @Get('leagues')
  @ApiOperation({ summary: 'Listar ligas disponibles en TheSportsDB o buscar por deporte/país' })
  leagues(@Query(new ZodValidationPipe(listSportsDbLeaguesQuerySchema)) query: ListSportsDbLeaguesQuery) {
    return this.sportsDb.listLeagues(query);
  }

  @Get('events')
  @ApiOperation({ summary: 'Listar partidos externos normalizados por liga, temporada o modo gratuito disponible' })
  events(@Query(new ZodValidationPipe(listSportsDbEventsQuerySchema)) query: ListSportsDbEventsQuery) {
    return this.sportsDb.listLeagueEvents(query);
  }

  @Get('world-cup/events')
  @ApiOperation({ summary: 'Listar partidos del Mundial normalizados desde TheSportsDB' })
  worldCupEvents(@Query(new ZodValidationPipe(listWorldCupEventsQuerySchema)) query: ListWorldCupEventsQuery) {
    return this.sportsDb.listWorldCupEvents(query);
  }
}
