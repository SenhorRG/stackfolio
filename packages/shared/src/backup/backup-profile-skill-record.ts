import { z } from 'zod';
import { SKILL_LEVELS } from '../enums/skill-level';

export const backupProfileSkillRecordSchema = z.object({
  skillSlug: z.string().min(1),
  level: z.enum(SKILL_LEVELS as [string, ...string[]]),
  years: z.number().nullable().optional(),
  highlight: z.boolean().default(false),
  /** Resume category; resolved from skill catalog when unset in DB (legacy backups may contain null). */
  displayCategory: z.string().nullable().optional(),
});

export type BackupProfileSkillRecord = z.infer<
  typeof backupProfileSkillRecordSchema
>;
