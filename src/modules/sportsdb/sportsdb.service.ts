import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { AppError } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { SportsDbClient } from './sportsdb.client';
import { normalizeExternalMatch, normalizeLeague, normalizeSport } from './sportsdb.mapper';

export type EventsMode = 'season' | 'next' | 'past' | 'day';

@Injectable()
export class SportsDbService {
  constructor(private readonly config: ConfigService<Env, true>, private readonly client: SportsDbClient) {}

  async listSports() {
    const sports = await this.client.getAllSports();
    return {
      source: 'thesportsdb',
      items: sports.map(normalizeSport).filter(Boolean)
    };
  }

  async listLeagues(query: { sport?: string; country?: string }) {
    const leagues = query.sport || query.country ? await this.client.searchLeagues(query) : await this.client.getAllLeagues();
    return {
      source: 'thesportsdb',
      filters: query,
      items: leagues.map(normalizeLeague).filter(Boolean)
    };
  }

  async listLeagueEvents(query: { leagueId: string; season?: string; mode?: EventsMode; date?: string }) {
    const mode = query.mode ?? (query.season ? 'season' : 'next');
    const events = await this.loadEvents({ ...query, mode });
    return {
      source: 'thesportsdb',
      mode,
      leagueId: query.leagueId,
      season: query.season ?? null,
      date: query.date ?? null,
      items: events.map(normalizeExternalMatch).filter(Boolean)
    };
  }

  async listWorldCupEvents(query: { leagueId?: string; season?: string; mode?: EventsMode; date?: string }) {
    const leagueId = query.leagueId ?? this.config.get('SPORTSDB_WORLD_CUP_LEAGUE_ID', { infer: true });
    if (!leagueId && query.mode !== 'day') {
      throw new AppError(
        ErrorCode.SPORTSDB_NOT_CONFIGURED,
        'Falta SPORTSDB_WORLD_CUP_LEAGUE_ID o query leagueId. No se inventa el ID del Mundial.',
        503
      );
    }

    const mode = query.mode ?? 'season';
    const events = mode === 'day'
      ? await this.client.getDailyEvents(query.date ?? new Date().toISOString().slice(0, 10), this.config.get('SPORTSDB_LEAGUE_NAME', { infer: true }))
      : await this.loadEvents({ leagueId: leagueId as string, season: query.season ?? this.config.get('SPORTSDB_WORLD_CUP_SEASON', { infer: true }), mode });

    return {
      source: 'thesportsdb',
      mode,
      leagueId: leagueId ?? null,
      season: query.season ?? this.config.get('SPORTSDB_WORLD_CUP_SEASON', { infer: true }) ?? null,
      items: events.map(normalizeExternalMatch).filter(Boolean)
    };
  }

  private loadEvents(query: { leagueId: string; season?: string; mode: EventsMode; date?: string }) {
    if (query.mode === 'season') {
      if (!query.season) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'season es requerido cuando mode=season.', 400);
      }
      return this.client.getSeasonEvents({ leagueId: query.leagueId, season: query.season });
    }
    if (query.mode === 'past') return this.client.getPastLeagueEvents(query.leagueId);
    if (query.mode === 'day') return this.client.getDailyEvents(query.date ?? new Date().toISOString().slice(0, 10));
    return this.client.getNextLeagueEvents(query.leagueId);
  }
}
