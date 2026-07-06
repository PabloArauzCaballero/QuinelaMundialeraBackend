import { z } from 'zod';

export const listSportsDbLeaguesQuerySchema = z.object({
  sport: z.string().trim().min(1).max(80).optional(),
  country: z.string().trim().min(1).max(80).optional()
});

export const sportsDbEventsModeSchema = z.enum(['season', 'next', 'past', 'day']);

export const listSportsDbEventsQuerySchema = z.object({
  leagueId: z.string().trim().min(1).max(30),
  season: z.string().trim().min(4).max(20).optional(),
  mode: sportsDbEventsModeSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const listWorldCupEventsQuerySchema = z.object({
  leagueId: z.string().trim().min(1).max(30).optional(),
  season: z.string().trim().min(4).max(20).optional(),
  mode: sportsDbEventsModeSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type ListSportsDbLeaguesQuery = z.infer<typeof listSportsDbLeaguesQuerySchema>;
export type ListSportsDbEventsQuery = z.infer<typeof listSportsDbEventsQuerySchema>;
export type ListWorldCupEventsQuery = z.infer<typeof listWorldCupEventsQuerySchema>;
