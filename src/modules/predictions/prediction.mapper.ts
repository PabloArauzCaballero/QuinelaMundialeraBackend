import { mapMatch } from '../matches/match.mapper';
import { PredictionModel } from './models/prediction.model';

export function mapPrediction(prediction: PredictionModel) {
  return {
    id: prediction.id,
    userId: prediction.userId,
    matchId: prediction.matchId,
    predictedHomeScore: prediction.predictedHomeScore,
    predictedAwayScore: prediction.predictedAwayScore,
    points: prediction.points,
    status: prediction.status,
    match: prediction.match ? mapMatch(prediction.match) : undefined,
    createdAt: prediction.createdAt,
    updatedAt: prediction.updatedAt
  };
}
