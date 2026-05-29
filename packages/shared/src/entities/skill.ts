import { z } from 'zod';

export const skillUrlsSchema = z
  .object({
    official: z.string().url().optional(),
    docs: z.string().url().optional(),
    github: z.string().url().optional(),
    roadmap: z.string().url().optional(),
  })
  .strict()
  .optional();

export const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().min(1),
  description: z.string().nullable().optional(),
  urls: skillUrlsSchema,
  resources: z.array(z.record(z.unknown())).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Skill = z.infer<typeof skillSchema>;

export const createSkillSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1),
  description: z.string().optional(),
  urls: skillUrlsSchema,
  resources: z.array(z.record(z.unknown())).optional(),
});

export const updateSkillSchema = createSkillSchema.partial();

export const listSkillsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
