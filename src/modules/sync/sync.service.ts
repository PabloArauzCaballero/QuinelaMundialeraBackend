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
        : await this.client.getSeasonEvents({ leagueId: input.leagueId, season: input.season as string });

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
