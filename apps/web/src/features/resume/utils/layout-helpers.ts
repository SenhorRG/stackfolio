import {
  createDefaultPages,
  getDetachedSectionIds,
  normalizePages,
  sanitizeSectionIds,
  syncEditorPagesFromRender,
  syncPagesToProject,
  type JsonLayoutShape,
  type ProfileResumeSource,
  type ResumePageLayout,
  type ResumeSectionIdValue,
} from '@stackfolio/shared';
import type { ResumeProject } from '../hooks/use-resume-project';

export function getLayout(project: ResumeProject): JsonLayoutShape {
  return (project.jsonLayout ?? { sections: {} }) as JsonLayoutShape;
}

export function getPages(project: ResumeProject): ResumePageLayout[] {
  const layout = getLayout(project);
  const order = (project.sectionOrder ?? []) as ResumeSectionIdValue[];
  return normalizePages(layout, order);
}

export function patchLayoutPages(
  project: ResumeProject,
  pages: ResumePageLayout[],
): Partial<ResumeProject> {
  const layout = getLayout(project);
  const synced = syncPagesToProject(layout, pages);
  return {
    jsonLayout: synced.jsonLayout,
    sectionOrder: synced.sectionOrder,
    pageCount: synced.pageCount,
  };
}

export function addPage(project: ResumeProject): Partial<ResumeProject> {
  const pages = getPages(project);
  const nextId = `page-${pages.length + 1}`;
  return patchLayoutPages(project, [...pages, { id: nextId, sectionIds: [] }]);
}

export function getDetached(project: ResumeProject): ResumeSectionIdValue[] {
  return getDetachedSectionIds(getLayout(project));
}

export function removePage(
  project: ResumeProject,
  pageIndex: number,
): Partial<ResumeProject> & { visibility: Record<string, boolean> } | null {
  const pages = getPages(project);
  if (pageIndex <= 0 || pageIndex >= pages.length) return null;

  const layout = getLayout(project);
  const removedIds = sanitizeSectionIds(pages[pageIndex].sectionIds);
  const nextPages = pages.filter((_, i) => i !== pageIndex);
  const detached = sanitizeSectionIds([
    ...getDetachedSectionIds(layout),
    ...removedIds,
  ]);

  const nextVisibility = { ...project.visibility };
  for (const id of removedIds) {
    nextVisibility[id] = false;
  }

  const synced = syncPagesToProject(layout, nextPages, detached);
  return { ...synced, visibility: nextVisibility };
}

export function patchDetachedAndPages(
  project: ResumeProject,
  pages: ResumePageLayout[],
  detachedSectionIds: ResumeSectionIdValue[],
): Partial<ResumeProject> {
  const layout = getLayout(project);
  const synced = syncPagesToProject(layout, pages, detachedSectionIds);
  return {
    jsonLayout: synced.jsonLayout,
    sectionOrder: synced.sectionOrder,
    pageCount: synced.pageCount,
  };
}

export function ensurePagesInitialized(
  project: ResumeProject,
): Partial<ResumeProject> | null {
  const layout = getLayout(project);
  if (layout.pages?.length) return null;
  const order = (project.sectionOrder ?? []) as ResumeSectionIdValue[];
  const pages = createDefaultPages(order);
  return patchLayoutPages(project, pages);
}

export function syncOverflowPagesFromPreview(
  project: ResumeProject,
  profile: ProfileResumeSource,
): Partial<ResumeProject> | null {
  const layout = getLayout(project);
  const order = (project.sectionOrder ?? []) as ResumeSectionIdValue[];
  const nextPages = syncEditorPagesFromRender(
    layout,
    order,
    project.visibility,
    profile,
  );
  if (!nextPages) return null;
  return patchLayoutPages(project, nextPages);
}
