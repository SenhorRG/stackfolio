import { z } from 'zod';
import { profileIdentitySchema } from '../entities/profile-identity';
import { backupProfileSkillRecordSchema } from './backup-profile-skill-record';

export const backupProfileRecordSchema = z.object({
  exportId: z.string().min(1),
  name: z.string().min(1).max(120),
  basedOnExportId: z.string().min(1).nullable().optional(),
  profileData: profileIdentitySchema,
  skills: z.array(backupProfileSkillRecordSchema).default([]),
});

export type BackupProfileRecord = z.infer<typeof backupProfileRecordSchema>;
