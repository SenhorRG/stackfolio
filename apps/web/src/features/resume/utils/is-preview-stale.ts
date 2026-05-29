import type { ResumeProject } from '../hooks/use-resume-project';
import { buildPreviewSnapshot } from './preview-snapshot';

export function isPreviewStale(
  draft: ResumeProject,
  previewRenderedBaseline: string,
): boolean {
  return buildPreviewSnapshot(draft) !== previewRenderedBaseline;
}
