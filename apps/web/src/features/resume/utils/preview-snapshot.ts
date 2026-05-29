import type { ResumeProject } from '../hooks/use-resume-project';

export function buildPreviewSnapshot(project: ResumeProject): string {
  return JSON.stringify({
    name: project.name,
    theme: project.theme,
    font: project.font,
    spacing: project.spacing,
    dividerStyle: project.dividerStyle,
    sectionOrder: project.sectionOrder,
    visibility: project.visibility,
    pageCount: project.pageCount,
    jsonLayout: project.jsonLayout,
    updatedAt: project.updatedAt,
  });
}
