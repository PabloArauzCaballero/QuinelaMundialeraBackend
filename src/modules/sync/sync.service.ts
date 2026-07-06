import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { toIsoDateOnly } from '../../common/utils/date.util';
import { MatchRepository } from '../matches/match.repository';
import { PredictionsService } from '../predictions/predictions.service';
import { SportsDbClient, SportsDbEvent } from './sportsdb.client';
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
      const events = await this.client.getDailyEvents(date);
      const updatedMatchIds: string[] = [];
      let checked = 0;

      for (const event of events) {
        checked += 1;
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

  listRuns() {
    return this.syncRuns.listRuns();
  }

  private mapScore(event: SportsDbEvent): { homeScore: number | null; awayScore: number | null; status: string } | null {
    const rawStatus = (event.strStatus || '').trim().toUpperCase();
    const isPostponed = event.strPostponed === 'yes';

    let status: string;
    if (rawStatus === 'FT') {
      status = 'finished';
    } else if (rawStatus === 'NS' && !isPostponed) {
      status = 'scheduled';
    } else if (isPostponed) {
      status = 'postponed';
    } else {
      status = 'live';
    }

    // Parse scores: vienen como string ("2", "0") o null si no se jugó
    if (event.intHomeScore === null || event.intAwayScore === null) return null;
    const homeScore = Number(event.intHomeScore);
    const awayScore = Number(event.intAwayScore);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;

    return { homeScore, awayScore, status };
  }
}
