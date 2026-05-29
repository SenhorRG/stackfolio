import { z } from 'zod';
import { SkillLevel } from '../enums/skill-level';

export const profileSkillSchema = z.object({
  profileId: z.string(),
  skillId: z.string(),
  level: z.enum([
    SkillLevel.BEGINNER,
    SkillLevel.INTERMEDIATE,
    SkillLevel.ADVANCED,
    SkillLevel.EXPERT,
  ]),
  years: z.number().min(0).max(50).nullable().optional(),
  highlight: z.boolean().default(false),
  displayCategory: z.string().trim().min(1).max(80).nullable().optional(),
});

export type ProfileSkill = z.infer<typeof profileSkillSchema>;

export const upsertProfileSkillSchema = z.object({
  skillId: z.string(),
  level: profileSkillSchema.shape.level,
  years: z.number().min(0).max(50).optional(),
  highlight: z.boolean().optional(),
  displayCategory: z.string().trim().min(1).max(80).nullable().optional(),
});
