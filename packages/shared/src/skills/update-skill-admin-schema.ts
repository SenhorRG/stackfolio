import { z } from 'zod';
import { skillUrlsSchema } from '../entities/skill';
import { skillResourcesSchema } from './skill-resources-schema';

export const updateSkillAdminSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens')
      .max(120)
      .optional(),
    category: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    urls: skillUrlsSchema,
    resources: skillResourcesSchema.optional(),
  })
  .strict();

export type UpdateSkillAdminInput = z.infer<typeof updateSkillAdminSchema>;
