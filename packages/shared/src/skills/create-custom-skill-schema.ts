import { z } from 'zod';
import { slugifySkillName } from './slugify-skill-name';

export const CUSTOM_SKILL_CATEGORY = 'Custom';

export const createCustomSkillInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens')
    .max(120)
    .optional(),
  category: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional(),
});

export type CreateCustomSkillInput = z.infer<typeof createCustomSkillInputSchema>;

export function resolveCustomSkillSlug(input: CreateCustomSkillInput): string {
  const raw = input.slug?.trim() || slugifySkillName(input.name);
  return raw.slice(0, 120);
}

export function resolveCustomSkillCategory(input: CreateCustomSkillInput): string {
  return input.category?.trim() || CUSTOM_SKILL_CATEGORY;
}
