import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { StadiumModel } from './models/stadium.model';
import { TeamModel } from './models/team.model';
import { MatchModel } from './models/match.model';
import type { CreateMatchInput, ListMatchesQuery, UpdateMatchInput } from './match.schemas';

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
    return this.matches.findOne({ where: { externalId } });
  }

  findTeamById(teamId: string): Promise<TeamModel | null> {
    return this.teams.findByPk(teamId);
  }

  findStadiumById(stadiumId: string): Promise<StadiumModel | null> {
    return this.stadiums.findByPk(stadiumId);
  }

  list(query: ListMatchesQuery): Promise<MatchModel[]> {
    const where: WhereOptions = {};
    if (query.phase) Object.assign(where, { phase: query.phase });
    if (query.status) Object.assign(where, { status: query.status });
    if (query.stadiumId) Object.assign(where, { stadiumId: query.stadiumId });
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
    return this.matches.create(input as any);
  }

  async updateInfo(match: MatchModel, input: UpdateMatchInput): Promise<MatchModel> {
    await match.update(input as any);
    return this.findById(match.id) as Promise<MatchModel>;
  }

  async updateOfficialScore(match: MatchModel, input: { homeScore: number | null; awayScore: number | null; status: string; lastSyncedAt: Date }): Promise<void> {
    await match.update(input as any);
  }
}
