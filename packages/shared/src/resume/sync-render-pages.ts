import type { ResumeSectionIdValue } from '../enums/resume-section';
import {
  applyPageOverflow,
  type RenderPage,
} from './page-overflow';
import type { JsonLayoutShape, ResumePageLayout } from './layout-types';
import { ensureUniquePageIds } from './page-ids';
import { buildPrimarySectionPageIndex } from './section-primary-page';
import { getTheme } from './theme';
import { normalizePages } from './pages';
import { relocateTrailingSectionsAfterOverflow } from './relocate-trailing-sections-after-overflow';
import { resolveSectionContent } from './resolve-section-content';
import type { ProfileResumeSource } from './layout-types';

export function computeRenderPages(
  layout: JsonLayoutShape,
  sectionOrder: ResumeSectionIdValue[],
  visibility: Record<string, boolean>,
  profile: ProfileResumeSource,
): RenderPage[] {
  const manualPages = normalizePages(layout, sectionOrder);
  const resolvedSections = new Map<
    ResumeSectionIdValue,
    Record<string, unknown>
  >();

  for (const sectionId of sectionOrder) {
    if (sectionId === 'header') continue;
    resolvedSections.set(
      sectionId,
      resolveSectionContent(sectionId, layout.sections, profile),
    );
  }
  resolvedSections.set(
    'header',
    resolveSectionContent('header', layout.sections, profile),
  );

  return applyPageOverflow(
    manualPages,
    visibility,
    resolvedSections,
    getTheme(layout),
    layout.continuationOverrides,
    layout.pageMetricsTuning,
  );
}

function continuationIds(page: ResumePageLayout): ResumeSectionIdValue[] {
  return page.continuationSectionIds ?? [];
}

function pagesEqual(a: ResumePageLayout[], b: ResumePageLayout[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((page, index) => {
    const other = b[index]!;
    if (page.id !== other.id) return false;
    if (page.sectionIds.length !== other.sectionIds.length) return false;
    if (!page.sectionIds.every((id, i) => id === other.sectionIds[i])) {
      return false;
    }
    const contA = continuationIds(page);
    const contB = continuationIds(other);
    if (contA.length !== contB.length) return false;
    return contA.every((id, i) => id === contB[i]);
  });
}

export { ensureUniquePageIds } from './page-ids';

function buildFirstRenderPageBySection(
  renderPages: RenderPage[],
): Map<ResumeSectionIdValue, number> {
  const map = new Map<ResumeSectionIdValue, number>();
  renderPages.forEach((page, pageIndex) => {
    for (const id of page.sectionIds) {
      if (id === 'header') continue;
      if (!map.has(id)) map.set(id, pageIndex);
    }
  });
  return map;
}

function buildContinuationIdsFromRenderPage(
  renderPage: RenderPage,
  pageIndex: number,
  firstRenderPageBySection: Map<ResumeSectionIdValue, number>,
  sectionOrder: ResumeSectionIdValue[],
): ResumeSectionIdValue[] {
  const continuationSectionIds: ResumeSectionIdValue[] = [];
  const seenContinuation = new Set<ResumeSectionIdValue>();
  const continuationSource =
    renderPage.slices.length > 0
      ? renderPage.slices.map((slice) => slice.sectionId)
      : renderPage.sectionIds.filter((id) => id !== 'header');

  for (const id of continuationSource) {
    if (id === 'header' || seenContinuation.has(id)) continue;
    const firstRenderPage = firstRenderPageBySection.get(id);
    if (firstRenderPage !== undefined && pageIndex > firstRenderPage) {
      continuationSectionIds.push(id);
      seenContinuation.add(id);
    }
  }

  if (sectionOrder.length) {
    continuationSectionIds.sort(
      (a, b) => sectionOrder.indexOf(a) - sectionOrder.indexOf(b),
    );
  }

  return continuationSectionIds;
}

function buildOverflowPageFromRender(
  renderPage: RenderPage,
  pageIndex: number,
  firstRenderPageBySection: Map<ResumeSectionIdValue, number>,
  sectionOrder: ResumeSectionIdValue[],
): ResumePageLayout {
  const continuationSectionIds = buildContinuationIdsFromRenderPage(
    renderPage,
    pageIndex,
    firstRenderPageBySection,
    sectionOrder,
  );
  return {
    id: renderPage.id,
    sectionIds: [],
    ...(continuationSectionIds.length ? { continuationSectionIds } : {}),
  };
}

/**
 * Keeps manual primary section placement; only syncs continuation rows and
 * auto-appends overflow pages when render output grows.
 */
export function syncEditorPagesFromRender(
  layout: JsonLayoutShape,
  sectionOrder: ResumeSectionIdValue[],
  visibility: Record<string, boolean>,
  profile: ProfileResumeSource,
): ResumePageLayout[] | null {
  const renderPages = computeRenderPages(
    layout,
    sectionOrder,
    visibility,
    profile,
  );
  const currentPages = ensureUniquePageIds(
    normalizePages(layout, sectionOrder),
  );
  const firstRenderPageBySection = buildFirstRenderPageBySection(renderPages);
  const nextPages: ResumePageLayout[] = [];
  const maxLen = Math.max(currentPages.length, renderPages.length);

  for (let pageIndex = 0; pageIndex < maxLen; pageIndex++) {
    const manual = currentPages[pageIndex];
    const render = renderPages[pageIndex];

    if (manual) {
      const continuationSectionIds = render
        ? buildContinuationIdsFromRenderPage(
            render,
            pageIndex,
            firstRenderPageBySection,
            sectionOrder,
          )
        : (manual.continuationSectionIds ?? []);
      nextPages.push({
        id: manual.id,
        sectionIds: manual.sectionIds,
        ...(continuationSectionIds.length ? { continuationSectionIds } : {}),
      });
      continue;
    }

    if (render) {
      nextPages.push(
        buildOverflowPageFromRender(
          render,
          pageIndex,
          firstRenderPageBySection,
          sectionOrder,
        ),
      );
    }
  }

  const relocated = relocateTrailingSectionsAfterOverflow(
    nextPages,
    renderPages,
  );
  if (pagesEqual(currentPages, relocated)) return null;
  return relocated;
}

function primaryPageIndexForSection(
  sectionId: ResumeSectionIdValue,
  primaryByManual: Map<ResumeSectionIdValue, number>,
  firstRenderPageBySection: Map<ResumeSectionIdValue, number>,
): number | undefined {
  return (
    primaryByManual.get(sectionId) ??
    firstRenderPageBySection.get(sectionId)
  );
}

/** @deprecated Prefer {@link syncEditorPagesFromRender} for editor sync. */
export function renderPagesToEditorPages(
  renderPages: RenderPage[],
  manualPages?: ResumePageLayout[],
  sectionOrder: ResumeSectionIdValue[] = [],
): ResumePageLayout[] {
  const primaryByManual = buildPrimarySectionPageIndex(manualPages ?? []);
  const firstRenderPageBySection = buildFirstRenderPageBySection(renderPages);
  const allSections = [...firstRenderPageBySection.keys()];

  return ensureUniquePageIds(
    renderPages.map((page, pageIndex) => {
      const manualOrder = manualPages?.[pageIndex]?.sectionIds ?? [];

      const sectionIds: ResumeSectionIdValue[] = [];
      const seenPrimary = new Set<ResumeSectionIdValue>();

      for (const id of manualOrder) {
        const primaryIndex = primaryPageIndexForSection(
          id,
          primaryByManual,
          firstRenderPageBySection,
        );
        if (primaryIndex !== pageIndex) continue;
        if (!firstRenderPageBySection.has(id)) continue;
        sectionIds.push(id);
        seenPrimary.add(id);
      }

      for (const id of allSections) {
        const primaryIndex = primaryPageIndexForSection(
          id,
          primaryByManual,
          firstRenderPageBySection,
        );
        if (primaryIndex !== pageIndex || seenPrimary.has(id)) continue;
        sectionIds.push(id);
        seenPrimary.add(id);
      }

      const continuationSectionIds = buildContinuationIdsFromRenderPage(
        page,
        pageIndex,
        firstRenderPageBySection,
        sectionOrder,
      );

      return {
        id: page.id,
        sectionIds,
        ...(continuationSectionIds.length
          ? { continuationSectionIds }
          : {}),
      };
    }),
  );
}
