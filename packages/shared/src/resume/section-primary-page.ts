import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { ResumePageLayout } from './layout-types';
import type { SectionRenderSlice } from './section-layout-units';

export function buildPrimarySectionPageIndex(
  pages: ResumePageLayout[],
): Map<ResumeSectionIdValue, number> {
  const map = new Map<ResumeSectionIdValue, number>();
  pages.forEach((page, pageIndex) => {
    for (const id of page.sectionIds) {
      if (id === 'header') continue;
      if (!map.has(id)) map.set(id, pageIndex);
    }
  });
  return map;
}

export function isForwardContinuationPage(
  sectionId: ResumeSectionIdValue,
  pageIndex: number,
  primaryBySection: Map<ResumeSectionIdValue, number>,
): boolean {
  const primaryPageIndex = primaryBySection.get(sectionId);
  return (
    primaryPageIndex !== undefined && pageIndex > primaryPageIndex
  );
}

export function sanitizeContinuationSectionIds(
  continuationSectionIds: ResumeSectionIdValue[] | undefined,
  pageIndex: number,
  primaryBySection: Map<ResumeSectionIdValue, number>,
): ResumeSectionIdValue[] {
  if (!continuationSectionIds?.length) return [];
  return continuationSectionIds.filter((sectionId) =>
    isForwardContinuationPage(sectionId, pageIndex, primaryBySection),
  );
}

export function sanitizeResumePageContinuations(
  pages: ResumePageLayout[],
): ResumePageLayout[] {
  const primaryBySection = buildPrimarySectionPageIndex(pages);
  return pages.map((page, pageIndex) => {
    const continuationSectionIds = sanitizeContinuationSectionIds(
      page.continuationSectionIds,
      pageIndex,
      primaryBySection,
    );
    return {
      id: page.id,
      sectionIds: page.sectionIds,
      ...(continuationSectionIds.length
        ? { continuationSectionIds }
        : {}),
    };
  });
}

export function relocateSlicesBeforePrimaryPage(
  packed: SectionRenderSlice[][],
  manualPages: ResumePageLayout[],
): SectionRenderSlice[][] {
  const primaryBySection = buildPrimarySectionPageIndex(manualPages);
  if (!primaryBySection.size) return packed;

  const result = packed.map((page) => [...page]);
  const orphaned: SectionRenderSlice[] = [];

  for (let pageIndex = 0; pageIndex < result.length; pageIndex++) {
    const kept: SectionRenderSlice[] = [];
    for (const slice of result[pageIndex]!) {
      const primary = primaryBySection.get(slice.sectionId);
      if (primary !== undefined && pageIndex < primary) {
        orphaned.push(slice);
      } else {
        kept.push(slice);
      }
    }
    result[pageIndex] = kept;
  }

  for (const slice of orphaned) {
    const primary = primaryBySection.get(slice.sectionId)!;
    if (!result[primary]) result[primary] = [];
    result[primary]!.push(slice);
  }

  while (result.length > 0 && !result[result.length - 1]!.length) {
    result.pop();
  }

  return result;
}
