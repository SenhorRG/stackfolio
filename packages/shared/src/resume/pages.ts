import {
  DEFAULT_SECTION_ORDER,
  ResumeSectionId,
  type ResumeSectionIdValue,
} from '../enums/resume-section';
import type { JsonLayoutShape, ResumePageLayout } from './layout-types';
import { ensureUniquePageIds } from './page-ids';
import { sanitizeResumePageContinuations } from './section-primary-page';

export type { JsonLayoutShape, ResumePageLayout };

export function sanitizeSectionIds(
  ids: readonly unknown[],
): ResumeSectionIdValue[] {
  const valid = new Set<ResumeSectionIdValue>(ResumeSectionId);
  const seen = new Set<ResumeSectionIdValue>();
  const result: ResumeSectionIdValue[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !valid.has(id as ResumeSectionIdValue)) continue;
    const sectionId = id as ResumeSectionIdValue;
    if (seen.has(sectionId)) continue;
    seen.add(sectionId);
    result.push(sectionId);
  }
  return result;
}

export function createDefaultPages(
  sectionOrder: ResumeSectionIdValue[] = DEFAULT_SECTION_ORDER,
): ResumePageLayout[] {
  const bodySections = sectionOrder.filter((id) => id !== 'header');
  return [{ id: 'page-1', sectionIds: [...bodySections] }];
}

export function normalizePages(
  layout: JsonLayoutShape | Record<string, unknown>,
  sectionOrder: ResumeSectionIdValue[],
): ResumePageLayout[] {
  const shape = layout as JsonLayoutShape;
  const order =
    sectionOrder.length > 0 ? sectionOrder : [...ResumeSectionId];
  const bodyOrder = order.filter((id) => id !== 'header');

  if (shape.pages?.length) {
    const normalized = shape.pages.map((page, index) => {
      const sectionIds = sanitizeSectionIds(page.sectionIds).filter(
        (id) => id !== 'header',
      );
      const continuationSectionIds = sanitizeSectionIds(
        page.continuationSectionIds ?? [],
      ).filter((id) => id !== 'header' && !sectionIds.includes(id));
      return {
        id: page.id || `page-${index + 1}`,
        sectionIds,
        ...(continuationSectionIds.length
          ? { continuationSectionIds }
          : {}),
      };
    });
    return ensureUniquePageIds(sanitizeResumePageContinuations(normalized));
  }

  return [{ id: 'page-1', sectionIds: [...bodyOrder] }];
}

export function buildSectionOrder(pages: ResumePageLayout[]): ResumeSectionIdValue[] {
  const seen = new Set<ResumeSectionIdValue>();
  const ordered: ResumeSectionIdValue[] = ['header'];
  for (const page of pages) {
    for (const id of page.sectionIds) {
      if (id === 'header' || seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
  }
  for (const id of ResumeSectionId) {
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

export function flattenPageSections(pages: ResumePageLayout[]): ResumeSectionIdValue[] {
  return buildSectionOrder(pages).filter((id) => id !== 'header');
}

export function getDetachedSectionIds(layout: JsonLayoutShape): ResumeSectionIdValue[] {
  return sanitizeSectionIds(layout.detachedSectionIds ?? []);
}

export function syncPagesToProject(
  layout: JsonLayoutShape,
  pages: ResumePageLayout[],
  detachedSectionIds?: ResumeSectionIdValue[],
): {
  jsonLayout: JsonLayoutShape;
  sectionOrder: ResumeSectionIdValue[];
  pageCount: number;
} {
  const detached =
    detachedSectionIds !== undefined
      ? sanitizeSectionIds(detachedSectionIds)
      : getDetachedSectionIds(layout);
  const nextLayout: JsonLayoutShape = { ...layout, pages, detachedSectionIds: detached };
  return {
    jsonLayout: nextLayout,
    sectionOrder: buildSectionOrder(pages),
    pageCount: pages.length,
  };
}
