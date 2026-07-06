import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { AppError } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { SportsDbClient } from './sportsdb.client';
import { normalizeExternalMatch, normalizeLeague, normalizeSport } from './sportsdb.mapper';

export type EventsMode = 'season' | 'next' | 'past' | 'day';

interface ListLeagueEventsQuery {
  leagueId?: string;
  season?: string;
  mode?: EventsMode;
  date?: string;
  sport?: string;
  leagueName?: string;
}

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
    const leagues = await this.client.searchLeagues(query);
    return {
      source: 'thesportsdb',
      filters: query,
      items: leagues.map(normalizeLeague).filter(Boolean)
    };
  }

  async listLeagueEvents(query: ListLeagueEventsQuery) {
    const mode = query.mode ?? (query.leagueId ? (query.season ? 'season' : 'next') : 'day');
    const events = await this.loadEvents({ ...query, mode });
    return {
      source: 'thesportsdb',
      mode,
      leagueId: query.leagueId ?? null,
      season: query.season ?? null,
      date: query.date ?? null,
      sport: query.sport ?? null,
      leagueName: query.leagueName ?? null,
      items: events.map(normalizeExternalMatch).filter(Boolean)
    };
  }

  async listWorldCupEvents(query: { leagueId?: string; season?: string; mode?: EventsMode; date?: string }) {
    const leagueId = query.leagueId ?? this.config.get('SPORTSDB_WORLD_CUP_LEAGUE_ID', { infer: true });
    const mode = query.mode ?? (leagueId ? 'season' : 'day');

    if (!leagueId && mode !== 'day') {
      throw new AppError(
        ErrorCode.SPORTSDB_NOT_CONFIGURED,
        'Falta SPORTSDB_WORLD_CUP_LEAGUE_ID o query leagueId. No se inventa el ID del Mundial.',
        503
      );
    }

    const season = query.season ?? this.config.get('SPORTSDB_WORLD_CUP_SEASON', { infer: true });
    const events = mode === 'day'
      ? await this.client.getDailyEvents(query.date ?? new Date().toISOString().slice(0, 10), {
          sport: 'Soccer',
          leagueId: leagueId ?? undefined,
          leagueName: leagueId ? undefined : this.config.get('SPORTSDB_LEAGUE_NAME', { infer: true })
        })
      : await this.loadEvents({ leagueId: leagueId as string, season, mode });

    return {
      source: 'thesportsdb',
      mode,
      leagueId: leagueId ?? null,
      season: season ?? null,
      date: query.date ?? null,
      items: events.map(normalizeExternalMatch).filter(Boolean)
    };
  }

  private loadEvents(query: { leagueId?: string; season?: string; mode: EventsMode; date?: string; sport?: string; leagueName?: string }) {
    if (query.mode === 'day') {
      return this.client.getDailyEvents(query.date ?? new Date().toISOString().slice(0, 10), {
        sport: query.sport,
        leagueId: query.leagueId,
        leagueName: query.leagueName
      });
    }

    if (!query.leagueId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'leagueId es requerido cuando mode es season, next o past.', 400);
    }

    if (query.mode === 'season') {
      if (!query.season) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'season es requerido cuando mode=season.', 400);
      }
      return this.client.getSeasonEvents({ leagueId: query.leagueId, season: query.season });
    }

    if (query.mode === 'past') return this.client.getPastLeagueEvents(query.leagueId);
    return this.client.getNextLeagueEvents(query.leagueId);
  }
}
