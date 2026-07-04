import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(3).max(120)
});

export const joinGroupSchema = z.object({
  invitationCode: z.string().trim().min(6).max(20).transform((value) => value.toUpperCase())
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
