import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MatchModel } from '../matches/models/match.model';
import { StadiumModel } from '../matches/models/stadium.model';
import { TeamModel } from '../matches/models/team.model';
import { PredictionModel } from './models/prediction.model';

@Injectable()
export class PredictionRepository {
  constructor(@InjectModel(PredictionModel) private readonly predictions: typeof PredictionModel) {}

  findById(id: string): Promise<PredictionModel | null> {
    return this.predictions.findByPk(id, { include: [{ model: MatchModel, include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel] }] });
  }

  findByUserAndMatch(userId: string, matchId: string): Promise<PredictionModel | null> {
    return this.predictions.findOne({ where: { userId, matchId } });
  }

  findMine(userId: string): Promise<PredictionModel[]> {
    return this.predictions.findAll({
      where: { userId },
      include: [{ model: MatchModel, include: [{ model: TeamModel, as: 'homeTeam' }, { model: TeamModel, as: 'awayTeam' }, StadiumModel] }],
      order: [['createdAt', 'DESC']]
    });
  }

  create(input: { userId: string; matchId: string; predictedHomeScore: number; predictedAwayScore: number }): Promise<PredictionModel> {
    return this.predictions.create(input as any);
  }

  async update(prediction: PredictionModel, input: { predictedHomeScore: number; predictedAwayScore: number; points?: number; status?: string }): Promise<PredictionModel> {
    await prediction.update(input as any);
    return this.findById(prediction.id) as Promise<PredictionModel>;
  }

  findByUserIds(userIds: string[]): Promise<PredictionModel[]> {
    return this.predictions.findAll({ where: { userId: { [Op.in]: userIds } } });
  }

  findByMatchIds(matchIds: string[]): Promise<PredictionModel[]> {
    return this.predictions.findAll({ where: { matchId: { [Op.in]: matchIds } }, include: [MatchModel] });
  }
}
