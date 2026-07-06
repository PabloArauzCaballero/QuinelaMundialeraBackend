import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import type { Env } from '../../config/env.schema';
import { AppError } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';
import type { SportsDbEvent, SportsDbLeague, SportsDbSport } from './sportsdb.types';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

interface DailyEventsFilters {
  sport?: string;
  leagueName?: string;
  leagueId?: string;
}

@Injectable()
export class SportsDbClient {
  private readonly logger = new Logger(SportsDbClient.name);
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly config: ConfigService<Env, true>) {}

  async getAllSports(): Promise<SportsDbSport[]> {
    const data = await this.get<{ sports?: SportsDbSport[] }>('all_sports.php');
    return data.sports ?? [];
  }

  async getAllLeagues(): Promise<SportsDbLeague[]> {
    const data = await this.get<{ leagues?: SportsDbLeague[] }>('all_leagues.php');
    return data.leagues ?? [];
  }

  async searchLeagues(params: { sport?: string; country?: string }): Promise<SportsDbLeague[]> {
    const hasSport = Boolean(params.sport?.trim());
    const hasCountry = Boolean(params.country?.trim());

    if (!hasSport && !hasCountry) {
      return this.getAllLeagues();
    }

    // TheSportsDB free plan can return empty when only `s=Soccer` is sent to
    // search_all_leagues.php. The safe behavior for the frontend is to use
    // all_leagues.php as the fallback and filter locally. This does not invent
    // leagues; it only filters records already returned by TheSportsDB.
    if (hasSport && !hasCountry) {
      const allLeagues = await this.getAllLeagues();
      const filtered = this.filterLeagues(allLeagues, params);
      if (filtered.length > 0) return filtered;
    }

    const query: Record<string, string> = {};
    if (params.sport) query.s = params.sport;
    if (params.country) query.c = params.country;

    const data = await this.get<{ countrys?: SportsDbLeague[]; leagues?: SportsDbLeague[] }>('search_all_leagues.php', query);
    const remote = data.countrys ?? data.leagues ?? [];
    if (remote.length > 0) return remote;

    const fallback = await this.getAllLeagues();
    return this.filterLeagues(fallback, params);
  }

  async getSeasonEvents(params: { leagueId: string; season: string }): Promise<SportsDbEvent[]> {
    const data = await this.get<{ events?: SportsDbEvent[] }>('eventsseason.php', { id: params.leagueId, s: params.season });
    return data.events ?? [];
  }

  async getRoundEvents(params: { leagueId: string; round: number; season: string }): Promise<SportsDbEvent[]> {
    const data = await this.get<{ events?: SportsDbEvent[] }>('eventsround.php', {
      id: params.leagueId,
      r: String(params.round),
      s: params.season
    });
    return data.events ?? [];
  }

  async getNextLeagueEvents(leagueId: string): Promise<SportsDbEvent[]> {
    const data = await this.get<{ events?: SportsDbEvent[] }>('eventsnextleague.php', { id: leagueId });
    return data.events ?? [];
  }

  async getPastLeagueEvents(leagueId: string): Promise<SportsDbEvent[]> {
    const data = await this.get<{ events?: SportsDbEvent[] }>('eventspastleague.php', { id: leagueId });
    return data.events ?? [];
  }

  async getDailyEvents(date: string, filters?: string | DailyEventsFilters): Promise<SportsDbEvent[]> {
    const query: Record<string, string> = { d: date };

    if (typeof filters === 'string') {
      if (filters.trim()) query.l = filters.trim();
    } else if (filters) {
      if (filters.sport?.trim()) query.s = filters.sport.trim();
      if (filters.leagueId?.trim()) query.l = filters.leagueId.trim();
      else if (filters.leagueName?.trim()) query.l = filters.leagueName.trim();
    }

    const data = await this.get<{ events?: SportsDbEvent[] }>('eventsday.php', query);
    return data.events ?? [];
  }

  async lookupEvent(eventId: string): Promise<SportsDbEvent | null> {
    const data = await this.get<{ events?: SportsDbEvent[] }>('lookupevent.php', { id: eventId });
    return data.events?.[0] ?? null;
  }

  private filterLeagues(leagues: SportsDbLeague[], params: { sport?: string; country?: string }): SportsDbLeague[] {
    const sport = normalizeFilter(params.sport);
    const country = normalizeFilter(params.country);

    return leagues.filter((league) => {
      const leagueSport = normalizeFilter(league.strSport);
      const leagueCountry = normalizeFilter(league.strCountry);
      const matchesSport = !sport || leagueSport === sport;
      const matchesCountry = !country || leagueCountry === country;
      return matchesSport && matchesCountry;
    });
  }

  private async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const apiKey = this.config.get('SPORTSDB_API_KEY', { infer: true });
    const baseUrl = this.config.get('SPORTSDB_BASE_URL', { infer: true }).replace(/\/$/, '');
    const ttlMs = this.config.get('SPORTSDB_CACHE_TTL_SECONDS', { infer: true }) * 1000;

    if (!apiKey) {
      throw new AppError(ErrorCode.SPORTSDB_NOT_CONFIGURED, 'SPORTSDB_API_KEY no configurado.', 503);
    }

    const safeEndpoint = endpoint.replace(/^\/+/, '');
    const cacheKey = `${safeEndpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    try {
      const response = await axios.get<T>(`${baseUrl}/${apiKey}/${safeEndpoint}`, {
        params,
        timeout: this.config.get('SPORTSDB_TIMEOUT_MS', { infer: true })
      });

      this.cache.set(cacheKey, { value: response.data, expiresAt: Date.now() + ttlMs });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const message = status === 429
        ? 'TheSportsDB rechazó la consulta por límite de plan gratuito. Reintenta luego o reduce frecuencia.'
        : `No se pudo consultar TheSportsDB (${safeEndpoint}).`;
      this.logger.warn(`${message} ${axiosError.message}`);
      throw new AppError(ErrorCode.SPORTSDB_UNAVAILABLE, message, status === 429 ? 429 : 503);
    }
  }
}

function normalizeFilter(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}
