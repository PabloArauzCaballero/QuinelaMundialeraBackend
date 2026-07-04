import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { Env } from '../../config/env.schema';
import { AppError } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';

export interface SportsDbEvent {
  idEvent: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
}

@Injectable()
export class SportsDbClient {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async getDailyEvents(date: string): Promise<SportsDbEvent[]> {
    // PENDIENTE_ATLAS: validar campos reales de TheSportsDB para Mundial 2026 y límites de API gratuita.
    const apiKey = this.config.get('SPORTSDB_API_KEY', { infer: true });
    const baseUrl = this.config.get('SPORTSDB_BASE_URL', { infer: true }).replace(/\/$/, '');
    const leagueName = this.config.get('SPORTSDB_LEAGUE_NAME', { infer: true });
    if (!apiKey) throw new AppError(ErrorCode.SPORTSDB_NOT_CONFIGURED, 'SPORTSDB_API_KEY no configurado.', 503);

    const response = await axios.get<{ events?: SportsDbEvent[] }>(`${baseUrl}/${apiKey}/eventsday.php`, {
      params: { d: date, l: leagueName },
      timeout: 12000
    });

    return response.data.events ?? [];
  }
}
