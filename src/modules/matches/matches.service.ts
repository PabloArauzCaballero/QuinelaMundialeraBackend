import { Injectable } from '@nestjs/common';
import { badRequest, notFound } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { AuditService } from '../audit/audit.service';
import { MatchRepository } from './match.repository';
import { mapMatch } from './match.mapper';
import type { CreateMatchInput, ListMatchesQuery, UpdateMatchInput } from './match.schemas';
import type { MatchModel } from './models/match.model';

@Injectable()
export class MatchesService {
  constructor(private readonly matches: MatchRepository, private readonly audit: AuditService) {}

  async list(query: ListMatchesQuery) {
    const matches = await this.matches.list(query);
    return matches.map(mapMatch);
  }

  async detail(matchId: string) {
    const match = await this.matches.findById(matchId);
    if (!match) throw notFound('Partido no encontrado.');
    return mapMatch(match);
  }

  async createAdmin(adminUserId: string, input: CreateMatchInput, requestId?: string) {
    await this.assertValidReferences(input);
    const match = await this.matches.create(input);
    await this.audit.record({ actorUserId: adminUserId, action: 'match.create', resourceType: 'match', resourceId: match.id, requestId });
    const fullMatch = await this.matches.findById(match.id);
    return mapMatch(fullMatch ?? match);
  }

  async updateAdmin(adminUserId: string, matchId: string, input: UpdateMatchInput, requestId?: string) {
    const match = await this.matches.findById(matchId);
    if (!match) throw notFound('Partido no encontrado.');
    await this.assertValidUpdate(match, input);
    const updated = await this.matches.updateInfo(match, input);
    await this.audit.record({ actorUserId: adminUserId, action: 'match.update_info', resourceType: 'match', resourceId: matchId, requestId });
    return mapMatch(updated);
  }

  upcoming(limit = 10) {
    return this.matches.upcoming(limit).then((items) => items.map(mapMatch));
  }

  private async assertValidReferences(input: Pick<CreateMatchInput, 'homeTeamId' | 'awayTeamId' | 'stadiumId'>): Promise<void> {
    if (input.homeTeamId === input.awayTeamId) {
      throw badRequest(ErrorCode.VALIDATION_ERROR, 'Los equipos no pueden ser iguales.');
    }
    const [homeTeam, awayTeam, stadium] = await Promise.all([
      this.matches.findTeamById(input.homeTeamId),
      this.matches.findTeamById(input.awayTeamId),
      this.matches.findStadiumById(input.stadiumId)
    ]);
    if (!homeTeam) throw notFound('Equipo local no encontrado.');
    if (!awayTeam) throw notFound('Equipo visitante no encontrado.');
    if (!stadium) throw notFound('Estadio no encontrado.');
  }

  private async assertValidUpdate(match: MatchModel, input: UpdateMatchInput): Promise<void> {
    const effectiveHomeTeamId = input.homeTeamId ?? match.homeTeamId;
    const effectiveAwayTeamId = input.awayTeamId ?? match.awayTeamId;
    const effectiveStadiumId = input.stadiumId ?? match.stadiumId;
    await this.assertValidReferences({ homeTeamId: effectiveHomeTeamId, awayTeamId: effectiveAwayTeamId, stadiumId: effectiveStadiumId });
  }
}
