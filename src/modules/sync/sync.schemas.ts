import { z } from 'zod';

export const importLeagueEventsSchema = z.object({
  leagueId: z.string().trim().min(1).max(30),
  season: z.string().trim().min(4).max(20).optional(),
  mode: z.enum(['season', 'next', 'past']).default('season')
}).refine((value) => value.mode !== 'season' || Boolean(value.season), 'season es requerido cuando mode=season.');

export const importWorldCupEventsSchema = z.object({
  leagueId: z.string().trim().min(1).max(30).optional(),
  season: z.string().trim().min(4).max(20).optional(),
  mode: z.enum(['season', 'next', 'past', 'day']).default('season'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type ImportLeagueEventsInput = z.infer<typeof importLeagueEventsSchema>;
export type ImportWorldCupEventsInput = z.infer<typeof importWorldCupEventsSchema>;
