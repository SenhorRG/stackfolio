import type { ResumeSectionIdValue } from '../enums/resume-section';
import { decomposeFullItemSlice } from './decompose-full-item-slice';
import {
  measurePageContentHeight,
  normalizePageSliceShowHeadings,
  reorderPageSlicesBySectionBlocks,
} from './page-overflow';
import type { LayoutUnit, SectionRenderSlice } from './section-layout-units';
import type { PackingMetrics } from './typography-packing-metrics';

function pageExceedsBudget(
  slices: SectionRenderSlice[],
  priorPages: SectionRenderSlice[][],
  pageIndex: number,
  firstPageHeaderPx: number,
  units: LayoutUnit[],
  metrics: PackingMetrics,
  sectionOrder: ResumeSectionIdValue[],
): boolean {
  if (!slices.length) return false;
  const normalized = normalizePageSliceShowHeadings(
    priorPages,
    reorderPageSlicesBySectionBlocks(slices, sectionOrder),
  );
  const used = measurePageContentHeight(
    normalized,
    pageIndex === 0,
    firstPageHeaderPx,
    units,
    metrics,
  );
  return used > metrics.packableHeightPx;
}

/**
 * Moves trailing slices forward when a page exceeds the packable height budget.
 * Preserves page indices and manual-primary placement from earlier pipeline steps.
 */
export function rebalanceOverflowingPagesOnly(
  packed: SectionRenderSlice[][],
  units: LayoutUnit[],
  firstPageHeaderPx: number,
  metrics: PackingMetrics,
  sectionOrder: ResumeSectionIdValue[],
): SectionRenderSlice[][] {
  const result = packed.map((page) => [...page]);
  let pageIndex = 0;

  while (pageIndex < result.length) {
    const priorPages = result.slice(0, pageIndex);

    while (
      result[pageIndex]?.length &&
      pageExceedsBudget(
        result[pageIndex]!,
        priorPages,
        pageIndex,
        firstPageHeaderPx,
        units,
        metrics,
        sectionOrder,
      )
    ) {
      const page = result[pageIndex]!;
      const last = page[page.length - 1];
      const decomposed = last ? decomposeFullItemSlice(last, units) : null;

      if (decomposed && decomposed.length > 1) {
        result[pageIndex] = [
          ...page.slice(0, -1),
          ...decomposed,
        ];
        continue;
      }

      const moved = page.pop()!;
      if (!result[pageIndex + 1]) {
        result[pageIndex + 1] = [];
      }
      result[pageIndex + 1]!.unshift(moved);
    }

    pageIndex += 1;
  }

  while (result.length > 0 && !result[result.length - 1]!.length) {
    result.pop();
  }

  return result;
}
