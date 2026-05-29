import type { ResumeSectionIdValue } from '../enums/resume-section';
import { sanitizeResumePageContinuations } from './section-primary-page';
import type { RenderPage } from './page-overflow';
import type { ResumePageLayout } from './layout-types';

type SectionRenderRange = {
  first: number;
  last: number;
};

function buildRenderPageRangeBySection(
  renderPages: RenderPage[],
): Map<ResumeSectionIdValue, SectionRenderRange> {
  const map = new Map<ResumeSectionIdValue, SectionRenderRange>();
  renderPages.forEach((page, pageIndex) => {
    for (const slice of page.slices) {
      if (slice.sectionId === 'header') continue;
      const existing = map.get(slice.sectionId);
      if (!existing) {
        map.set(slice.sectionId, { first: pageIndex, last: pageIndex });
        continue;
      }
      existing.last = pageIndex;
    }
  });
  return map;
}

/**
 * When a section continues on a later page, moves trailing primary sections on
 * the same manual page to the first overflow page so editor order matches preview.
 */
export function relocateTrailingSectionsAfterOverflow(
  manualPages: ResumePageLayout[],
  renderPages: RenderPage[],
): ResumePageLayout[] {
  if (!manualPages.length || !renderPages.length) return manualPages;

  const rangeBySection = buildRenderPageRangeBySection(renderPages);
  const pages = manualPages.map((page) => ({
    id: page.id,
    sectionIds: [...page.sectionIds],
    ...(page.continuationSectionIds?.length
      ? { continuationSectionIds: [...page.continuationSectionIds] }
      : {}),
  }));

  const ensurePage = (index: number) => {
    while (pages.length <= index) {
      const renderPage = renderPages[pages.length];
      pages.push({
        id: renderPage?.id ?? `page-${pages.length + 1}`,
        sectionIds: [],
      });
    }
  };

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex]!;
    let scanIndex = 0;

    while (scanIndex < page.sectionIds.length) {
      const sectionId = page.sectionIds[scanIndex]!;
      const range = rangeBySection.get(sectionId);
      if (!range || range.last <= range.first) {
        scanIndex += 1;
        continue;
      }

      const trailing = page.sectionIds.splice(scanIndex + 1);
      if (!trailing.length) {
        scanIndex += 1;
        continue;
      }

      const targetPageIndex = range.first + 1;
      ensurePage(targetPageIndex);
      pages[targetPageIndex]!.sectionIds.push(...trailing);
    }
  }

  return sanitizeResumePageContinuations(pages);
}
