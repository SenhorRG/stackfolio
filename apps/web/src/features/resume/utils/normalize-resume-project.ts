import {
  normalizeJsonLayoutSkillsDisplay,
  type JsonLayoutShape,
} from '@stackfolio/shared';
import type { ResumeProject } from '../hooks/use-resume-project';

export function normalizeResumeProject(raw: unknown): ResumeProject {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    profileId: String(r.profileId ?? ''),
    name: String(r.name ?? 'My Resume'),
    theme: String(r.theme ?? 'classic'),
    font: String(r.font ?? 'inter'),
    spacing: String(r.spacing ?? 'normal'),
    sectionOrder: Array.isArray(r.sectionOrder)
      ? (r.sectionOrder as string[])
      : [],
    visibility:
      r.visibility && typeof r.visibility === 'object'
        ? (r.visibility as Record<string, boolean>)
        : {},
    dividerStyle: String(r.dividerStyle ?? 'line'),
    pageCount: typeof r.pageCount === 'number' ? r.pageCount : 1,
    jsonLayout: normalizeJsonLayoutSkillsDisplay(
      (r.jsonLayout ?? { sections: {} }) as JsonLayoutShape,
    ),
    updatedAt:
      typeof r.updatedAt === 'string' ? r.updatedAt : undefined,
  };
}
