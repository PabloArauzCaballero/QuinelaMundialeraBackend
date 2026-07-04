import { z } from 'zod';

export const uuidParamSchema = z.object({ id: z.string().uuid() });
export const groupIdParamSchema = z.object({ groupId: z.string().uuid() });
export const matchIdParamSchema = z.object({ matchId: z.string().uuid() });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
