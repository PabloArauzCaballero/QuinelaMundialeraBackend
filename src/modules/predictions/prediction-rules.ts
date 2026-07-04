import { AppError } from '../../common/errors/app-error';
import { ErrorCode } from '../../common/errors/error-code.enum';

export interface PredictionScoreInput {
  predictedHomeScore: number;
  predictedAwayScore: number;
}

export interface MatchScoreInput {
  homeScore: number | null;
  awayScore: number | null;
}

export interface MatchLockInput {
  startsAt: Date | string;
  status: string;
}

function outcome(home: number, away: number): 'home' | 'away' | 'draw' {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

export function calculatePredictionPoints(prediction: PredictionScoreInput, match: MatchScoreInput): number {
  // PENDIENTE_ATLAS: confirmar regla definitiva de puntuación con producto/docente.
  if (match.homeScore === null || match.awayScore === null) return 0;
  const exact = prediction.predictedHomeScore === match.homeScore && prediction.predictedAwayScore === match.awayScore;
  if (exact) return 3;
  const predictedOutcome = outcome(prediction.predictedHomeScore, prediction.predictedAwayScore);
  const officialOutcome = outcome(match.homeScore, match.awayScore);
  return predictedOutcome === officialOutcome ? 1 : 0;
}

export function assertPredictionIsEditable(match: MatchLockInput): void {
  const hasStarted = new Date(match.startsAt).getTime() <= Date.now();
  if (hasStarted || match.status !== 'scheduled') {
    throw new AppError(ErrorCode.PREDICTION_LOCKED, 'No se puede crear o modificar el pronóstico porque el partido ya inició.', 409);
  }
}
