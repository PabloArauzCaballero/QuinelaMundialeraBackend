import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { StadiumModel } from './models/stadium.model';
import { TeamModel } from './models/team.model';
import { MatchModel } from './models/match.model';
import type { CreateMatchInput, ListMatchesQuery, UpdateMatchInput } from './match.schemas';
import type { NormalizedExternalMatch } from '../sportsdb/sportsdb.types';

@Injectable()
export class MatchRepository {
  constructor(
    @InjectModel(MatchModel) private readonly matches: typeof MatchModel,
    @InjectModel(TeamModel) private readonly teams: typeof TeamModel,
    @InjectModel(StadiumModel) private readonly stadiums: typeof StadiumModel
  ) {}

  findById(id: string): Promise<MatchModel | null> {
    return this.matches.findByPk(id, { include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel] });
  }

  findByExternalId(externalId: string): Promise<MatchModel | null> {
    return this.matches.findOne({ where: { externalId }, include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel] });
  }

  findTeamById(teamId: string): Promise<TeamModel | null> {
    return this.teams.findByPk(teamId);
  }

  findStadiumById(stadiumId: string): Promise<StadiumModel | null> {
    return this.stadiums.findByPk(stadiumId);
  }

  findTeamBySourceExternalId(source: string, externalId: string): Promise<TeamModel | null> {
    return this.teams.findOne({ where: { source, externalId } });
  }

  findStadiumBySourceExternalId(source: string, externalId: string): Promise<StadiumModel | null> {
    return this.stadiums.findOne({ where: { source, externalId } });
  }

  findAllTeams(): Promise<TeamModel[]> {
    return this.teams.findAll({ order: [['name', 'ASC']] });
  }

  findAllStadiums(): Promise<StadiumModel[]> {
    return this.stadiums.findAll({ order: [['name', 'ASC']] });
  }

  list(query: ListMatchesQuery): Promise<MatchModel[]> {
    const where: WhereOptions = {};
    if (query.phase) Object.assign(where, { phase: query.phase });
    if (query.status) Object.assign(where, { status: query.status });
    if (query.stadiumId) Object.assign(where, { stadiumId: query.stadiumId });
    if (query.source) Object.assign(where, { source: query.source });
    if (query.leagueExternalId) Object.assign(where, { leagueExternalId: query.leagueExternalId });
    if (query.season) Object.assign(where, { season: query.season });
    if (query.teamId) Object.assign(where, { [Op.or]: [{ homeTeamId: query.teamId }, { awayTeamId: query.teamId }] });
    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      const end = new Date(`${query.date}T23:59:59.999Z`);
      Object.assign(where, { startsAt: { [Op.between]: [start, end] } });
    }
    return this.matches.findAll({ where, include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel], order: [['startsAt', 'ASC']] });
  }

  upcoming(limit = 10): Promise<MatchModel[]> {
    return this.matches.findAll({
      where: { status: 'scheduled', startsAt: { [Op.gt]: new Date() } },
      include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel],
      order: [['startsAt', 'ASC']],
      limit
    });
  }

  todaysMatches(): Promise<MatchModel[]> {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    return this.matches.findAll({ where: { startsAt: { [Op.between]: [start, end] } } });
  }

  create(input: CreateMatchInput): Promise<MatchModel> {
    return this.matches.create({ ...input, source: 'manual' } as any);
  }

  async upsertExternalMatch(input: NormalizedExternalMatch): Promise<{ match: MatchModel | null; action: 'created' | 'updated' | 'skipped'; reason?: string }> {
    if (!input.startsAt) return { match: null, action: 'skipped', reason: 'Evento sin fecha/hora válida.' };
    if (!input.homeTeam.externalId || !input.homeTeam.name) return { match: null, action: 'skipped', reason: 'Evento sin equipo local válido.' };
    if (!input.awayTeam.externalId || !input.awayTeam.name) return { match: null, action: 'skipped', reason: 'Evento sin equipo visitante válido.' };

    const [homeTeam, awayTeam, stadium] = await Promise.all([
      this.upsertExternalTeam(input.homeTeam),
      this.upsertExternalTeam(input.awayTeam),
      this.upsertExternalStadium(input.stadium)
    ]);

    const existing = await this.findByExternalId(input.externalId);
    const payload = {
      externalId: input.externalId,
      source: input.source,
      leagueExternalId: input.league.externalId,
      leagueName: input.league.name,
      season: input.league.season,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      stadiumId: stadium?.id ?? null,
      phase: input.phase,
      status: input.status,
      startsAt: new Date(input.startsAt),
      homeScore: input.score.home,
      awayScore: input.score.away,
      lastSyncedAt: new Date()
    };

    if (existing) {
      await existing.update(payload as any);
      return { match: await this.findById(existing.id), action: 'updated' };
    }

    const created = await this.matches.create(payload as any);
    return { match: await this.findById(created.id), action: 'created' };
  }

  async updateInfo(match: MatchModel, input: UpdateMatchInput): Promise<MatchModel> {
    await match.update(input as any);
    return this.findById(match.id) as Promise<MatchModel>;
  }

  async updateOfficialScore(match: MatchModel, input: { homeScore: number | null; awayScore: number | null; status: string; lastSyncedAt: Date }): Promise<void> {
    await match.update(input as any);
  }

  private async upsertExternalTeam(input: NormalizedExternalMatch['homeTeam']): Promise<TeamModel> {
    const existing = await this.findTeamBySourceExternalId('thesportsdb', input.externalId as string);
    const payload = {
      source: 'thesportsdb',
      externalId: input.externalId,
      name: input.name,
      shortName: input.shortName ?? input.name,
      fifaCode: `TSDB_${input.externalId}`.slice(0, 12),
      flagUrl: input.flagUrl
    };
    if (existing) {
      await existing.update(payload as any);
      return existing;
    }
    return this.teams.create(payload as any);
  }

  private async upsertExternalStadium(input: NormalizedExternalMatch['stadium']): Promise<StadiumModel | null> {
    if (!input || (!input.externalId && !input.name)) return null;
    const externalId = input.externalId ?? `name:${input.name}`;
    const existing = await this.findStadiumBySourceExternalId('thesportsdb', externalId);
    const payload = {
      source: 'thesportsdb',
      externalId,
      name: input.name,
      city: input.city,
      country: input.country,
      latitude: null,
      longitude: null
    };
    if (existing) {
      await existing.update(payload as any);
      return existing;
    }
    return this.stadiums.create(payload as any);
  }
}

