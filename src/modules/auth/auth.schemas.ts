import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(10).max(120).regex(/[A-Z]/, 'Debe incluir al menos una mayúscula.').regex(/[0-9]/, 'Debe incluir al menos un número.')
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(1).max(120)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
