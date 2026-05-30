import type { ResumeProject } from '@prisma/client';
import {
  normalizeJsonLayoutForBackup,
  type BackupResumeRecord,
} from '@stackfolio/shared';

export function serializeResumeForBackup(
  project: ResumeProject,
): BackupResumeRecord {
  return {
    exportId: project.id,
    profileExportId: project.profileId,
    name: project.name,
    theme: project.theme,
    font: project.font,
    spacing: project.spacing,
    sectionOrder: project.sectionOrder as BackupResumeRecord['sectionOrder'],
    visibility: project.visibility as Record<string, boolean>,
    dividerStyle: project.dividerStyle,
    pageCount: project.pageCount,
    jsonLayout: normalizeJsonLayoutForBackup(project.jsonLayout),
  };
}
