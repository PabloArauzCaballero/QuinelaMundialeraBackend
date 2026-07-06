<<<<<<< HEAD
export { SportsDbClient } from '../sportsdb/sportsdb.client';
export type { SportsDbEvent } from '../sportsdb/sportsdb.types';
=======
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { Env } from '../../config/env.schema';
import { AppError } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';

export interface SportsDbEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  strPostponed?: string;
  idVenue: string;
  strVenue: string;
  strCountry: string;
  strCity?: string;
  dateEvent: string;
  strTime: string;
  intRound: string;
}

@Injectable()
export class SportsDbClient {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async getDailyEvents(date: string): Promise<SportsDbEvent[]> {
    const apiKey = this.config.get('SPORTSDB_EVENTS_KEY', { infer: true });
    const baseUrl = this.config.get('SPORTSDB_BASE_URL', { infer: true }).replace(/\/$/, '');
    const leagueId = this.config.get('SPORTSDB_LEAGUE_ID', { infer: true });
    if (!apiKey) throw new AppError(ErrorCode.SPORTSDB_NOT_CONFIGURED, 'SPORTSDB_EVENTS_KEY no configurado.', 503);

    const response = await axios.get<{ events?: SportsDbEvent[] }>(`${baseUrl}/${apiKey}/eventsday.php`, {
      params: { d: date, l: leagueId },
      timeout: 12000
    });

    return response.data.events ?? [];
  }
}
>>>>>>> 2778dc2869c23886b5d04a08592132e31018b8b7
