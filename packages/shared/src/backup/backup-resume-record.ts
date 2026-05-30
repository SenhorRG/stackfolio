import { z } from 'zod';
import { ResumeSectionId } from '../enums/resume-section';

const sectionIdEnum = z.enum(ResumeSectionId);

export const backupResumeRecordSchema = z.object({
  exportId: z.string().min(1),
  profileExportId: z.string().min(1),
  name: z.string(),
  theme: z.string(),
  font: z.string(),
  spacing: z.string(),
  sectionOrder: z.array(z.union([sectionIdEnum, z.string()])),
  visibility: z.record(z.string(), z.boolean()),
  dividerStyle: z.string(),
  pageCount: z.number().int().min(1),
  jsonLayout: z.record(z.string(), z.unknown()),
});

export type BackupResumeRecord = z.infer<typeof backupResumeRecordSchema>;
