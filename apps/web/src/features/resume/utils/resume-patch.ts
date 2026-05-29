import type { ResumeProject } from '../hooks/use-resume-project';

const UPDATABLE_KEYS = [
  'name',
  'theme',
  'font',
  'spacing',
  'sectionOrder',
  'visibility',
  'dividerStyle',
  'pageCount',
  'jsonLayout',
] as const;

export type ResumeProjectPatch = Partial<
  Pick<ResumeProject, (typeof UPDATABLE_KEYS)[number]>
>;

export function pickResumePatch(
  source: Partial<ResumeProject> | ResumeProject,
): ResumeProjectPatch {
  const patch: ResumeProjectPatch = {};
  for (const key of UPDATABLE_KEYS) {
    if (source[key] !== undefined) {
      (patch as Record<string, unknown>)[key] = source[key];
    }
  }
  return patch;
}
