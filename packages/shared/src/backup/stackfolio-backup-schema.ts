import { z } from 'zod';
import { STACKFOLIO_BACKUP_VERSION } from './backup-version';
import { backupProfileRecordSchema } from './backup-profile-record';
import { backupResumeRecordSchema } from './backup-resume-record';

export const stackfolioBackupSchema = z.object({
  stackfolioBackupVersion: z.literal(STACKFOLIO_BACKUP_VERSION),
  exportedAt: z.string().datetime(),
  profiles: z.array(backupProfileRecordSchema).default([]),
  resumeProjects: z.array(backupResumeRecordSchema).default([]),
});

export type StackfolioBackup = z.infer<typeof stackfolioBackupSchema>;

export const backupExportModeSchema = z.enum([
  'profiles_and_resumes',
  'profiles_only',
  'profile_resumes',
]);

export type BackupExportMode = z.infer<typeof backupExportModeSchema>;

export const backupExportRequestSchema = z.object({
  mode: backupExportModeSchema,
  profileIds: z.array(z.string().min(1)).optional(),
  resumeProjectIds: z.array(z.string().min(1)).optional(),
});

export type BackupExportRequest = z.infer<typeof backupExportRequestSchema>;
