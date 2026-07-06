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
  }

  async syncToday() {
    const startedAt = new Date();
    const date = toIsoDateOnly(startedAt);
    try {
      const events = await this.client.getDailyEvents(date, this.config.get('SPORTSDB_LEAGUE_NAME', { infer: true }));
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


  async importLeagueEvents(input: ImportLeagueEventsInput) {
    const startedAt = new Date();
    const events = input.mode === 'next'
      ? await this.client.getNextLeagueEvents(input.leagueId)
      : input.mode === 'past'
        ? await this.client.getPastLeagueEvents(input.leagueId)
        : await this.getFullSeasonEvents(input.leagueId, input.season as string);

    const result = await this.upsertExternalEvents(events);
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
      // devuelve null para esas rondas aunque el partido ya exista). Su strRound
      // llega numérico ("16", "8", "4"...) sin la etiqueta de fase; se la agregamos
      // acá para que el mapeador de fases (mapPhase) la reconozca por texto, sin
      // tocar la lógica genérica que también usan otras ligas.
      if (!collected.has(event.idEvent)) {
        collected.set(event.idEvent, { ...event, strRound: describeWorldCupKnockoutRound(event.strRound) ?? event.strRound });
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
      const events = await this.client.getDailyEvents(input.date ?? new Date().toISOString().slice(0, 10), this.config.get('SPORTSDB_LEAGUE_NAME', { infer: true }));
      const result = await this.upsertExternalEvents(events);
      return { source: 'thesportsdb', mode: 'day', leagueId: leagueId ?? null, ...result };
    }

    return this.importLeagueEvents({ leagueId: leagueId as string, season, mode: input.mode === 'past' ? 'past' : input.mode === 'next' ? 'next' : 'season' });
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

// eventsnextleague.php/eventspastleague.php del Mundial 2026 devuelven strRound
// numérico = cantidad de partidos de esa ronda de eliminación directa (16 llaves,
// 8, 4, 2, 1), sin texto. Solo se usa para partidos que ya sabemos que son de
// llave (no vinieron del barrido de rondas de grupos 1-3).
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
