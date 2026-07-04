import { Injectable } from '@nestjs/common';
import { conflict, forbidden, notFound } from '../../common/errors/app-error';
import { AuditService } from '../audit/audit.service';
import { GroupsService } from '../groups/groups.service';
import { MatchRepository } from '../matches/match.repository';
import { PredictionRepository } from './prediction.repository';
import { mapPrediction } from './prediction.mapper';
import { assertPredictionIsEditable, calculatePredictionPoints } from './prediction-rules';
import type { CreatePredictionInput, UpdatePredictionInput } from './prediction.schemas';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly predictions: PredictionRepository,
    private readonly matches: MatchRepository,
    private readonly groupsService: GroupsService,
    private readonly audit: AuditService
  ) {}

  async create(userId: string, input: CreatePredictionInput, requestId?: string) {
    const match = await this.matches.findById(input.matchId);
    if (!match) throw notFound('Partido no encontrado.');
    assertPredictionIsEditable(match);

    const existing = await this.predictions.findByUserAndMatch(userId, input.matchId);
    if (existing) throw conflict('Ya existe un pronóstico para este partido.');

    const prediction = await this.predictions.create({ userId, ...input });
    await this.audit.record({ actorUserId: userId, action: 'prediction.create', resourceType: 'prediction', resourceId: prediction.id, requestId });
    return this.getOwnPrediction(userId, prediction.id);
  }

  async update(userId: string, predictionId: string, input: UpdatePredictionInput, requestId?: string) {
    const prediction = await this.predictions.findById(predictionId);
    if (!prediction) throw notFound('Pronóstico no encontrado.');
    if (prediction.userId !== userId) throw forbidden('No puedes modificar un pronóstico de otro usuario.');
    if (!prediction.match) throw notFound('Partido del pronóstico no encontrado.');
    assertPredictionIsEditable(prediction.match);

    const updated = await this.predictions.update(prediction, input);
    await this.audit.record({ actorUserId: userId, action: 'prediction.update', resourceType: 'prediction', resourceId: predictionId, requestId });
    return mapPrediction(updated);
  }

  async listMine(userId: string) {
    const predictions = await this.predictions.findMine(userId);
    return predictions.map(mapPrediction);
  }

  async listMineByGroup(userId: string, groupId: string) {
    await this.groupsService.assertMember(groupId, userId);
    return this.listMine(userId);
  }

  async getOwnPrediction(userId: string, predictionId: string) {
    const prediction = await this.predictions.findById(predictionId);
    if (!prediction) throw notFound('Pronóstico no encontrado.');
    if (prediction.userId !== userId) throw forbidden('No puedes consultar un pronóstico de otro usuario.');
    return mapPrediction(prediction);
  }

  async recalculateForMatches(matchIds: string[]): Promise<number> {
    if (!matchIds.length) return 0;
    const predictions = await this.predictions.findByMatchIds(matchIds);
    let updated = 0;
    for (const prediction of predictions) {
      if (!prediction.match) continue;
      const points = calculatePredictionPoints(prediction, prediction.match);
      await this.predictions.update(prediction, { predictedHomeScore: prediction.predictedHomeScore, predictedAwayScore: prediction.predictedAwayScore, points, status: 'scored' });
      updated += 1;
    }
    return updated;
  }

  async totalPointsForUser(userId: string): Promise<number> {
    const predictions = await this.predictions.findMine(userId);
    return predictions.reduce((sum, prediction) => sum + prediction.points, 0);
  }
}
