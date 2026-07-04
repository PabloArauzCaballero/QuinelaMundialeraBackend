import { z } from 'zod';

export const updateMyProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(180).optional()
}).refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo para actualizar.');

export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;
