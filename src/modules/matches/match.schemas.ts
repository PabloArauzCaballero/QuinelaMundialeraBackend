import { z } from 'zod';

export const matchStatusSchema = z.enum(['scheduled', 'live', 'finished', 'postponed', 'cancelled']);
export const matchPhaseSchema = z.enum(['group', 'round_32', 'round_16', 'quarter_final', 'semi_final', 'third_place', 'final']);

export const listMatchesQuerySchema = z.object({
  phase: matchPhaseSchema.optional(),
  status: matchStatusSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  teamId: z.string().uuid().optional(),
  stadiumId: z.string().uuid().optional(),
  source: z.enum(['manual', 'thesportsdb']).optional(),
  leagueExternalId: z.string().trim().min(1).max(80).optional(),
  season: z.string().trim().min(4).max(20).optional()
});

export const createMatchSchema = z.object({
  externalId: z.string().trim().min(1).max(80).optional(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  stadiumId: z.string().uuid(),
  phase: matchPhaseSchema,
  status: matchStatusSchema.default('scheduled'),
  startsAt: z.coerce.date()
}).refine((value) => value.homeTeamId !== value.awayTeamId, 'Los equipos no pueden ser iguales.');

export const updateMatchSchema = z.object({
  externalId: z.string().trim().min(1).max(80).optional(),
  homeTeamId: z.string().uuid().optional(),
  awayTeamId: z.string().uuid().optional(),
  stadiumId: z.string().uuid().optional(),
  source: z.enum(['manual', 'thesportsdb']).optional(),
  leagueExternalId: z.string().trim().min(1).max(80).optional(),
  season: z.string().trim().min(4).max(20).optional(),
  phase: matchPhaseSchema.optional(),
  status: matchStatusSchema.optional(),
  startsAt: z.coerce.date().optional()
}).refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo.');

export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
