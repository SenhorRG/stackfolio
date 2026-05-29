import type { ResumeProject } from '../hooks/use-resume-project';
import { buildPreviewSnapshot } from './preview-snapshot';

export function isDraftDirty(
  draft: ResumeProject,
  savedBaseline: string,
): boolean {
  return buildPreviewSnapshot(draft) !== savedBaseline;
}
