import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  isMain: z.boolean(),
  basedOnProfileId: z.string().nullable().optional(),
  profileData: z.unknown().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Profile = z.infer<typeof profileSchema>;

export const createProfileSchema = z.object({
  name: z.string().min(1).max(120),
  basedOnProfileId: z.string().optional(),
  copyFromMain: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
});
