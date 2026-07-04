import { z } from 'zod';

const scoreSchema = z.coerce.number().int().min(0).max(30);

export const createPredictionSchema = z.object({
  matchId: z.string().uuid(),
  predictedHomeScore: scoreSchema,
  predictedAwayScore: scoreSchema
});

export const updatePredictionSchema = z.object({
  predictedHomeScore: scoreSchema,
  predictedAwayScore: scoreSchema
});

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;
export type UpdatePredictionInput = z.infer<typeof updatePredictionSchema>;
