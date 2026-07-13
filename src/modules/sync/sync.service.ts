import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { toIsoDateOnly } from '../../common/utils/date.util';
import { MatchRepository } from '../matches/match.repository';
import { PredictionsService } from '../predictions/predictions.service';
import { SportsDbClient } from '../sportsdb/sportsdb.client';
import type { SportsDbEvent } from '../sportsdb/sportsdb.types';
import { mapStatus, normalizeExternalMatch, normalizeStartDate, parseNullableInt } from '../sportsdb/sportsdb.mapper';
import type { ImportLeagueEventsInput, ImportWorldCupEventsInput } from './sync.schemas';
import { AppError } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { SyncRepository } from './sync.repository';

// PENDIENTE_ATLAS: definir logs estructurados/métricas para operación real.
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly client: SportsDbClient,
    private readonly matches: MatchRepository,
    private readonly predictions: PredictionsService,
    private readonly syncRuns: SyncRepository
  ) {}

  @Cron('0 */20 * * * *')
  async scheduledSync(): Promise<void> {
    if (!this.config.get('SYNC_ENABLED', { infer: true })) return;
    try {
      await this.syncToday();
    } catch (error) {
      this.logger.error(`Sync programado falló: ${(error as Error).message}`);
    }

    await this.catchUpWorldCupBracket();
  }

  // syncToday() solo actualiza el marcador de partidos que YA existen en la
  // base local (busca por externalId y si no lo encuentra, lo ignora). Nunca
  // crea partidos nuevos. Eso significa que octavos/cuartos/semifinal/final
  // nunca aparecerían solos: hay que traerlos con eventsnextleague.php /
  // eventspastleague.php (que sí reflejan la llave en vivo a medida que
  // TheSportsDB la va definiendo) para que la final no dependa de un import
  // manual. Se corre en cada tick del cron junto al sync diario.
  private async catchUpWorldCupBracket(): Promise<void> {
    const leagueId = this.config.get('SPORTSDB_WORLD_CUP_LEAGUE_ID', { infer: true });
    if (!leagueId) return; // No se inventa el ID del Mundial.

    for (const mode of ['next', 'past'] as const) {
      try {
        await this.importWorldCupEvents({ leagueId, mode });
      } catch (error) {
        this.logger.error(`Catch-up de llave del Mundial (${mode}) falló: ${(error as Error).message}`);
      }
    }
  }

  async syncToday() {
    const startedAt = new Date();
    const date = toIsoDateOnly(startedAt);
    try {
      // eventsday.php filtra `l` por id numérico de liga, no por nombre
      // (SPORTSDB_LEAGUE_NAME siempre devolvía "Invalid League ID passed" y 0
      // eventos, por lo que el sync automático nunca actualizaba nada).
      const leagueId = this.config.get('SPORTSDB_WORLD_CUP_LEAGUE_ID', { infer: true });
      const events = await this.client.getDailyEvents(date, { sport: 'Soccer', leagueId: leagueId ?? undefined });
      const updatedMatchIds: string[] = [];
      let checked = 0;

      for (const event of events) {
        checked += 1;
        if (!event.idEvent) continue;
        const match = await this.matches.findByExternalId(event.idEvent);
        if (!match) continue;
        const score = this.mapScore(event);
        if (!score) continue;
        await this.matches.updateOfficialScore(match, { ...score, lastSyncedAt: new Date() });
        updatedMatchIds.push(match.id);
      }

      const uniqueUpdatedMatchIds = [...new Set(updatedMatchIds)];
      const predictionsUpdated = await this.predictions.recalculateForMatches(uniqueUpdatedMatchIds);
      const run = await this.syncRuns.createRun({
        provider: 'thesportsdb',
        status: 'success',
        startedAt,
        finishedAt: new Date(),
        matchesChecked: checked,
        matchesUpdated: uniqueUpdatedMatchIds.length,
        errorSummary: null
      });

      return { runId: run.id, matchesUpdated: uniqueUpdatedMatchIds.length, predictionsUpdated };
    } catch (error) {
      const message = (error as Error).message;
      const run = await this.syncRuns.createRun({ provider: 'thesportsdb', status: 'failed', startedAt, finishedAt: new Date(), matchesChecked: 0, matchesUpdated: 0, errorSummary: message });
      return { runId: run.id, error: message };
    }
  }


  async importLeagueEvents(input: ImportLeagueEventsInput, transform?: (event: SportsDbEvent) => SportsDbEvent) {
    const startedAt = new Date();
    const events = input.mode === 'next'
      ? await this.client.getNextLeagueEvents(input.leagueId)
      : input.mode === 'past'
        ? await this.client.getPastLeagueEvents(input.leagueId)
        : await this.getFullSeasonEvents(input.leagueId, input.season as string);

    const result = await this.upsertExternalEvents(transform ? events.map(transform) : events);
    const run = await this.syncRuns.createRun({
      provider: 'thesportsdb',
      status: result.skipped > 0 ? 'partial' : 'success',
      startedAt,
      finishedAt: new Date(),
      matchesChecked: events.length,
      matchesUpdated: result.created + result.updated,
      errorSummary: result.skipped > 0 ? `Eventos omitidos: ${result.skipped}` : null
    });

    return { runId: run.id, ...result };
  }

  // TheSportsDB (plan gratuito) recorta eventsseason.php a 15 resultados.
  // eventsround.php no tiene ese límite, así que agregamos ronda por ronda.
  // Además, la llave (octavos en adelante) se define partido a partido a medida
  // que terminan los grupos: eventsround.php puede devolver null para esas rondas
  // aunque el partido ya exista, así que también combinamos eventsnextleague.php
  // y eventspastleague.php (que sí reflejan la llave en vivo) para no perder partidos.
  private async getFullSeasonEvents(leagueId: string, season: string): Promise<SportsDbEvent[]> {
    const maxRounds = 20;
    const collected = new Map<string, SportsDbEvent>();

    for (let round = 1; round <= maxRounds; round += 1) {
      const events = await this.client.getRoundEvents({ leagueId, round, season });
      for (const event of events) {
        if (!event.idEvent) continue;
        // Rondas 1-3 son la fase de grupos (round robin de 4 equipos). De ahí en
        // adelante, TheSportsDB numera la ronda de eliminación directa por
        // cantidad de llaves (16, 8, 4, 2, 1) en vez de texto ("Round of 32"...).
        const knockoutLabel = round > 3 ? describeWorldCupKnockoutRound(String(round)) : null;
        collected.set(event.idEvent, knockoutLabel ? { ...event, strRound: knockoutLabel } : event);
      }
    }

    const [nextEvents, pastEvents] = await Promise.all([
      this.client.getNextLeagueEvents(leagueId),
      this.client.getPastLeagueEvents(leagueId)
    ]);
    for (const event of [...nextEvents, ...pastEvents]) {
      if (!event.idEvent) continue;
      // Estos partidos de llave no estaban en el barrido por ronda (eventsround.php
      // devuelve null para esas rondas aunque el partido ya exista). Se etiquetan
      // por fecha (ver applyWorldCupKnockoutLabel) en vez de por strRound numérico:
      // eventsnextleague.php/eventspastleague.php para el Mundial 2026 no siguen el
      // esquema 16/8/4/2/1 (se vio "125", "150"...) y además ese número podría
      // coincidir con una jornada real de grupos (round=1,2,3) y etiquetarla mal.
      if (!collected.has(event.idEvent)) {
        collected.set(event.idEvent, applyWorldCupKnockoutLabel(event));
      }
    }

    if (collected.size === 0) {
      return this.client.getSeasonEvents({ leagueId, season });
    }

    return [...collected.values()];
  }

  async importWorldCupEvents(input: ImportWorldCupEventsInput) {
    const leagueId = input.leagueId ?? this.config.get('SPORTSDB_WORLD_CUP_LEAGUE_ID', { infer: true });
    const season = input.season ?? this.config.get('SPORTSDB_WORLD_CUP_SEASON', { infer: true });
    if (!leagueId && input.mode !== 'day') {
      throw new AppError(ErrorCode.SPORTSDB_NOT_CONFIGURED, 'Falta SPORTSDB_WORLD_CUP_LEAGUE_ID o leagueId. No se inventa el ID del Mundial.', 503);
    }

    if (input.mode === 'day') {
      const events = await this.client.getDailyEvents(input.date ?? new Date().toISOString().slice(0, 10), {
        sport: 'Soccer',
        leagueId: leagueId ?? undefined
      });
      const result = await this.upsertExternalEvents(events.map(applyWorldCupKnockoutLabel));
      return { source: 'thesportsdb', mode: 'day', leagueId: leagueId ?? null, ...result };
    }

    if (input.mode === 'next' || input.mode === 'past') {
      // eventsnextleague.php/eventspastleague.php no pasan por getFullSeasonEvents,
      // así que la fase se etiqueta acá con el mismo criterio (ver applyWorldCupKnockoutLabel).
      return this.importLeagueEvents({ leagueId: leagueId as string, season, mode: input.mode }, applyWorldCupKnockoutLabel);
    }

    return this.importLeagueEvents({ leagueId: leagueId as string, season, mode: 'season' });
  }

  private async upsertExternalEvents(events: SportsDbEvent[]) {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const skippedReasons: string[] = [];
    const updatedMatchIds: string[] = [];

    for (const event of events) {
      const normalized = normalizeExternalMatch(event);
      if (!normalized) {
        skipped += 1;
        skippedReasons.push('Evento sin idEvent válido.');
        continue;
      }
      const result = await this.matches.upsertExternalMatch(normalized);
      if (result.action === 'created') created += 1;
      if (result.action === 'updated') updated += 1;
      if (result.action === 'skipped') {
        skipped += 1;
        if (result.reason) skippedReasons.push(`${normalized.externalId}: ${result.reason}`);
      }
      if (result.match) updatedMatchIds.push(result.match.id);
    }

    const uniqueMatchIds = [...new Set(updatedMatchIds)];
    const predictionsUpdated = await this.predictions.recalculateForMatches(uniqueMatchIds);
    return { checked: events.length, created, updated, skipped, predictionsUpdated, skippedReasons: skippedReasons.slice(0, 20) };
  }

  listRuns() {
    return this.syncRuns.listRuns();
  }

  private mapScore(event: SportsDbEvent): { homeScore: number | null; awayScore: number | null; status: string } | null {
    const homeScore = parseNullableInt(event.intHomeScore);
    const awayScore = parseNullableInt(event.intAwayScore);
    if (homeScore === null || awayScore === null) return null;
    return { homeScore, awayScore, status: mapStatus(event, normalizeStartDate(event)) };
  }
}

// Solo se usa dentro del barrido eventsround.php?r=1..20 de getFullSeasonEvents,
// donde `round` es el índice de bucle (4..20) y no un dato del evento: ahí sí es
// seguro asumir el esquema "cantidad de llaves restantes" (16, 8, 4, 2, 1) que
// TheSportsDB usaba para ese endpoint. No usar con strRound de un evento suelto:
// round=1 también es la jornada 1 de grupos y se confundiría con la final.
function describeWorldCupKnockoutRound(strRound: string | null | undefined): string | null {
  const roundNumber = Number(strRound);
  if (!Number.isFinite(roundNumber)) return null;
  if (roundNumber === 16) return 'Round of 32';
  if (roundNumber === 8) return 'Round of 16';
  if (roundNumber === 4) return 'Quarterfinal';
  if (roundNumber === 2) return 'Semifinal';
  if (roundNumber === 1) return 'Final';
  return null;
}

// eventsnextleague.php/eventspastleague.php/eventsday.php del Mundial 2026 no
// siguen el esquema de arriba (confirmado en producción: cuartos de final
// llegaron con strRound="125", semifinal con "150") y el número tampoco es
// confiable por sí solo (podría ser una jornada real de grupos). Por eso estos
// eventos "sueltos" se etiquetan únicamente por la fecha oficial del cuadro de
// eliminación del Mundial 2026 (FIFA): si la fecha no cae en ese calendario, se
// deja el evento sin tocar y mapPhase lo clasifica como fase "group" por defecto.
function describeWorldCupKnockoutRoundByDate(dateEvent: string | null | undefined): string | null {
  if (!dateEvent) return null;
  const date = new Date(`${dateEvent}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const iso = date.toISOString().slice(0, 10);
  if (iso >= '2026-07-19') return 'Final';
  if (iso >= '2026-07-18') return 'Third place';
  if (iso >= '2026-07-14') return 'Semifinal';
  if (iso >= '2026-07-09') return 'Quarterfinal';
  if (iso >= '2026-07-04') return 'Round of 16';
  if (iso >= '2026-06-28') return 'Round of 32';
  return null;
}

function applyWorldCupKnockoutLabel(event: SportsDbEvent): SportsDbEvent {
  const knockoutLabel = describeWorldCupKnockoutRoundByDate(event.dateEvent);
  return knockoutLabel ? { ...event, strRound: knockoutLabel } : event;
}
