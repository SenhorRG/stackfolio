import type { ResumeSectionIdValue } from '../enums/resume-section';
import type {
  ContinuationMode,
  ResumePageLayout,
  ResumeTypography,
} from './layout-types';
import {
  applyContinuationOverrides,
  layoutUnitKey,
  matchesLayoutUnitKey,
} from './continuation-overrides';
import { relocateSlicesBeforePrimaryPage } from './section-primary-page';
import type { PageMetricsTuning } from './page-metrics-tuning';
import {
  resolvePackingMetrics,
  type PackingMetrics,
} from './typography-packing-metrics';
import { coalesceSlicesForLayout } from './coalesce-slice-batches';
import { shouldRenderSectionHeadingOnPage } from './should-render-section-heading-on-page';
import {
  buildLayoutUnits,
  type LayoutUnit,
  type SectionRenderSlice,
} from './section-layout-units';

export type { SectionRenderSlice } from './section-layout-units';
export {
  A4_CONTENT_HEIGHT_PX,
  A4_PACKABLE_HEIGHT_PX,
  CONTENT_PACKING_SAFETY_PX,
} from './page-metrics';
export { HEADER_HEIGHT_PX } from './typography-packing-metrics';

export type RenderPage = {
  id: string;
  sectionIds: ResumeSectionIdValue[];
  slices: SectionRenderSlice[];
  autoOverflow?: boolean;
};

type SliceHeading = {
  needsHeading: boolean;
  showHeading: boolean;
};

function flattenVisibleSections(
  manualPages: ResumePageLayout[],
  visibility: Record<string, boolean>,
): ResumeSectionIdValue[] {
  const seen = new Set<ResumeSectionIdValue>();
  const ordered: ResumeSectionIdValue[] = [];
  for (const page of manualPages) {
    for (const sectionId of page.sectionIds) {
      if (sectionId === 'header') continue;
      if (visibility[sectionId] === false) continue;
      if (seen.has(sectionId)) continue;
      seen.add(sectionId);
      ordered.push(sectionId);
    }
  }
  return ordered;
}

function reservePageId(
  usedIds: Set<string>,
  preferred: string | undefined,
  fallbackPrefix: 'page' | 'overflow',
  fallbackIndex: number,
): string {
  if (preferred && !usedIds.has(preferred)) {
    usedIds.add(preferred);
    return preferred;
  }
  let index = fallbackIndex;
  let candidate = `${fallbackPrefix}-${index}`;
  while (usedIds.has(candidate)) {
    index += 1;
    candidate = `${fallbackPrefix}-${index}`;
  }
  usedIds.add(candidate);
  return candidate;
}

function sectionAppearedOnPage(
  pageSlices: SectionRenderSlice[],
  sectionId: ResumeSectionIdValue,
): boolean {
  return pageSlices.some((slice) => slice.sectionId === sectionId);
}

function resolveSliceHeading(
  unit: LayoutUnit,
  _priorPages: SectionRenderSlice[][],
  pageSlices: SectionRenderSlice[],
  lastSectionOnPage: ResumeSectionIdValue | null,
): SliceHeading {
  const continuedOnCurrentPage = sectionAppearedOnPage(
    pageSlices,
    unit.sectionId,
  );
  const newOnPage = lastSectionOnPage !== unit.sectionId;
  const needsHeading = newOnPage && !continuedOnCurrentPage;
  return {
    needsHeading,
    showHeading: needsHeading,
  };
}

/** Align `showHeading` with final page order after packing/reorder. */
export function normalizePageSliceShowHeadings(
  _priorPages: SectionRenderSlice[][],
  slices: SectionRenderSlice[],
): SectionRenderSlice[] {
  const seenOnPage = new Set<ResumeSectionIdValue>();
  return slices.map((slice) => {
    const seenBeforeOnPage = seenOnPage.has(slice.sectionId);
    seenOnPage.add(slice.sectionId);
    const showHeading = !seenBeforeOnPage;
    return { ...slice, showHeading };
  });
}

function measureUnitBlockHeight(
  unit: LayoutUnit,
  metrics: PackingMetrics,
  heading: SliceHeading,
  needsLeadingGap: boolean,
  sameSectionPartGap: boolean,
): number {
  return (
    (needsLeadingGap ? metrics.sectionGapPx : 0) +
    (heading.needsHeading ? metrics.sectionTitleHeightPx : 0) +
    (sameSectionPartGap ? metrics.sectionPartGapPx : 0) +
    unit.contentHeightPx
  );
}

function isFirstPackedPage(priorPages: SectionRenderSlice[][]): boolean {
  return priorPages.length === 0;
}

function sliceFitsOnPage(
  pageSlices: SectionRenderSlice[],
  unit: LayoutUnit,
  heading: SliceHeading,
  priorPages: SectionRenderSlice[][],
  maxHeight: number,
  firstPageHeaderPx: number,
  units: LayoutUnit[],
  metrics: PackingMetrics,
  sectionOrder: ResumeSectionIdValue[],
): boolean {
  if (!pageSlices.length) return true;
  const candidate = reorderPageSlicesBySectionBlocks(
    normalizePageSliceShowHeadings(priorPages, [
      ...pageSlices,
      { ...unit.slice, showHeading: heading.showHeading },
    ]),
    sectionOrder,
  );
  return (
    measurePageContentHeight(
      candidate,
      isFirstPackedPage(priorPages),
      firstPageHeaderPx,
      units,
      metrics,
    ) <= maxHeight
  );
}

/** Height of consecutive units from the same section on one page. */
export function measureSectionRunHeight(
  run: LayoutUnit[],
  hasContentOnPage: boolean,
  metrics: PackingMetrics = resolvePackingMetrics(),
  continuedFromPriorPage = false,
): number {
  if (!run.length) return 0;
  let height = hasContentOnPage ? metrics.sectionGapPx : 0;
  if (!continuedFromPriorPage) {
    height += metrics.sectionTitleHeightPx;
  }
  for (let index = 0; index < run.length; index++) {
    if (index > 0) height += metrics.sectionPartGapPx;
    height += run[index]!.contentHeightPx;
  }
  return height;
}

function needsLeadingSectionGap(
  pageSlices: SectionRenderSlice[],
  lastSectionOnPage: ResumeSectionIdValue | null,
  unit: LayoutUnit,
): boolean {
  return pageSlices.length > 0 && lastSectionOnPage !== unit.sectionId;
}

function needsSameSectionPartGap(
  pageSlices: SectionRenderSlice[],
  lastSectionOnPage: ResumeSectionIdValue | null,
  unit: LayoutUnit,
): boolean {
  return pageSlices.length > 0 && lastSectionOnPage === unit.sectionId;
}

/** True when slice order never returns to a section after a later section started. */
export function pageSlicesAreNonInterleaved(
  slices: SectionRenderSlice[],
): boolean {
  const finished = new Set<ResumeSectionIdValue>();
  let current: ResumeSectionIdValue | null = null;
  for (const slice of slices) {
    if (slice.sectionId !== current) {
      if (finished.has(slice.sectionId)) return false;
      if (current != null) finished.add(current);
      current = slice.sectionId;
    }
  }
  return true;
}

/** Group contiguous slice runs per section, then order blocks by sectionOrder. */
export function reorderPageSlicesBySectionBlocks(
  slices: SectionRenderSlice[],
  sectionOrder: ResumeSectionIdValue[],
): SectionRenderSlice[] {
  if (slices.length < 2) return slices;

  const blocks: SectionRenderSlice[][] = [];
  let currentBlock: SectionRenderSlice[] = [];
  let currentSection: ResumeSectionIdValue | null = null;

  for (const slice of slices) {
    if (slice.sectionId !== currentSection) {
      if (currentBlock.length) blocks.push(currentBlock);
      currentBlock = [slice];
      currentSection = slice.sectionId;
    } else {
      currentBlock.push(slice);
    }
  }
  if (currentBlock.length) blocks.push(currentBlock);

  if (blocks.length < 2) return slices;

  blocks.sort(
    (a, b) =>
      sectionOrder.indexOf(a[0]!.sectionId) -
      sectionOrder.indexOf(b[0]!.sectionId),
  );

  return blocks.flat();
}

function pushUnitSlice(
  pageSlices: SectionRenderSlice[],
  unit: LayoutUnit,
  heading: SliceHeading,
): void {
  pageSlices.push({
    ...unit.slice,
    showHeading: heading.showHeading,
  });
}

function packUnitsIntoPages(
  units: LayoutUnit[],
  firstPageHeaderPx: number,
  metrics: PackingMetrics,
  sectionOrder: ResumeSectionIdValue[],
): SectionRenderSlice[][] {
  const pages: SectionRenderSlice[][] = [];
  const maxHeight = metrics.packableHeightPx;
  let pageStartIndex = 0;

  while (pageStartIndex < units.length) {
    const pageSlices: SectionRenderSlice[] = [];
    const priorPages = pages;
    const placedOnPage = new Set<number>();
    let packedAny = true;

    while (packedAny) {
      packedAny = false;
      for (let unitIndex = pageStartIndex; unitIndex < units.length; unitIndex++) {
        if (placedOnPage.has(unitIndex)) continue;

        const unit = units[unitIndex]!;
        const lastSectionOnPage =
          pageSlices.length > 0
            ? pageSlices[pageSlices.length - 1]!.sectionId
            : null;
        const heading = resolveSliceHeading(
          unit,
          priorPages,
          pageSlices,
          lastSectionOnPage,
        );

        if (
          !sliceFitsOnPage(
            pageSlices,
            unit,
            heading,
            priorPages,
            maxHeight,
            firstPageHeaderPx,
            units,
            metrics,
            sectionOrder,
          )
        ) {
          continue;
        }

        pushUnitSlice(pageSlices, unit, heading);
        placedOnPage.add(unitIndex);
        packedAny = true;
      }
    }

    if (!pageSlices.length && pageStartIndex < units.length) {
      const unit = units[pageStartIndex]!;
      const heading = resolveSliceHeading(unit, priorPages, pageSlices, null);
      pushUnitSlice(pageSlices, unit, heading);
      placedOnPage.add(pageStartIndex);
    }

    if (pageSlices.length > 0) {
      pages.push(
        normalizePageSliceShowHeadings(
          priorPages,
          reorderPageSlicesBySectionBlocks(pageSlices, sectionOrder),
        ),
      );
    }

    while (
      pageStartIndex < units.length &&
      placedOnPage.has(pageStartIndex)
    ) {
      pageStartIndex += 1;
    }
  }

  return pages;
}

function slicesToSectionIds(
  slices: SectionRenderSlice[],
): ResumeSectionIdValue[] {
  const ids: ResumeSectionIdValue[] = [];
  for (const slice of slices) {
    if (!ids.includes(slice.sectionId)) ids.push(slice.sectionId);
  }
  return ids;
}

type ContinuationAnchor = {
  primaryPageIndex: number;
  continuationPageIndices: number[];
};

function buildContinuationAnchors(
  manualPages: ResumePageLayout[],
): Map<ResumeSectionIdValue, ContinuationAnchor> {
  const primary = new Map<ResumeSectionIdValue, number>();
  const anchors = new Map<ResumeSectionIdValue, ContinuationAnchor>();

  manualPages.forEach((page, pageIndex) => {
    for (const sectionId of page.sectionIds) {
      if (!primary.has(sectionId)) {
        primary.set(sectionId, pageIndex);
      }
    }
    for (const sectionId of page.continuationSectionIds ?? []) {
      const primaryPageIndex = primary.get(sectionId);
      if (primaryPageIndex === undefined) continue;
      if (pageIndex <= primaryPageIndex) continue;
      const existing = anchors.get(sectionId);
      if (existing) {
        existing.continuationPageIndices.push(pageIndex);
      } else {
        anchors.set(sectionId, {
          primaryPageIndex,
          continuationPageIndices: [pageIndex],
        });
      }
    }
  });

  return anchors;
}

function layoutUnitContinuationKey(unit: LayoutUnit): string {
  return layoutUnitKey({
    ...unit.slice,
    showHeading: false,
    sectionId: unit.sectionId,
  });
}

function findLayoutUnitForSlice(
  units: LayoutUnit[],
  slice: SectionRenderSlice,
): LayoutUnit | undefined {
  const key = layoutUnitKey(slice);
  return units.find(
    (unit) =>
      unit.sectionId === slice.sectionId &&
      layoutUnitContinuationKey(unit) === key,
  );
}

function findListItemUnit(
  units: LayoutUnit[],
  sectionId: ResumeSectionIdValue,
  itemIndex: number,
  part: SectionRenderSlice['part'] = 'full',
): LayoutUnit | undefined {
  return units.find(
    (unit) =>
      unit.sectionId === sectionId &&
      unit.slice.itemStart === itemIndex &&
      (unit.slice.part ?? 'full') === part,
  );
}

function measureCommaSkillCoalescedBlock(
  slice: SectionRenderSlice,
  units: LayoutUnit[],
  metrics: PackingMetrics,
  heading: SliceHeading,
  needsLeadingGap: boolean,
): number {
  const batches =
    slice.commaLineParts ??
    (slice.skillBatchStart != null && slice.skillBatchEnd != null
      ? [
          {
            skillBatchStart: slice.skillBatchStart,
            skillBatchEnd: slice.skillBatchEnd,
          },
        ]
      : []);

  let blockHeight =
    (needsLeadingGap ? metrics.sectionGapPx : 0) +
    (heading.needsHeading ? metrics.sectionTitleHeightPx : 0);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]!;
    const unit = units.find(
      (candidate) =>
        candidate.sectionId === 'skills' &&
        candidate.slice.categoryStart === slice.categoryStart &&
        candidate.slice.categoryEnd === slice.categoryEnd &&
        candidate.slice.skillBatchStart === batch.skillBatchStart &&
        candidate.slice.skillBatchEnd === batch.skillBatchEnd,
    );
    if (!unit) continue;
    // Coalesced comma lines render as one <li> with <br/> (no inter-line sectionPartGap).
    blockHeight += unit.contentHeightPx;
  }

  return blockHeight;
}

function measureSkillCategoryRangeBlock(
  slice: SectionRenderSlice,
  units: LayoutUnit[],
  metrics: PackingMetrics,
  heading: SliceHeading,
  needsLeadingGap: boolean,
): number {
  const catStart = slice.categoryStart ?? 0;
  const catEnd = slice.categoryEnd ?? catStart + 1;
  let blockHeight =
    (needsLeadingGap ? metrics.sectionGapPx : 0) +
    (heading.needsHeading ? metrics.sectionTitleHeightPx : 0);

  for (let catIndex = catStart; catIndex < catEnd; catIndex++) {
    const categoryUnits = units.filter(
      (unit) =>
        unit.sectionId === 'skills' &&
        unit.slice.categoryStart === catIndex &&
        unit.slice.categoryEnd === catIndex + 1,
    );
    for (const unit of categoryUnits) {
      blockHeight += unit.contentHeightPx;
    }
  }

  return blockHeight;
}

function measureListItemRangeBlock(
  slice: SectionRenderSlice,
  units: LayoutUnit[],
  metrics: PackingMetrics,
  heading: SliceHeading,
  needsLeadingGap: boolean,
): number {
  const start = slice.itemStart ?? 0;
  const end = slice.itemEnd ?? start + 1;
  let blockHeight =
    (needsLeadingGap ? metrics.sectionGapPx : 0) +
    (heading.needsHeading ? metrics.sectionTitleHeightPx : 0);

  for (let itemIndex = start; itemIndex < end; itemIndex++) {
    const unit = findListItemUnit(units, slice.sectionId, itemIndex, 'full');
    if (!unit) continue;
    if (itemIndex > start) {
      blockHeight += metrics.sectionPartGapPx;
    }
    blockHeight += unit.contentHeightPx;
  }

  return blockHeight;
}

function measureCoalescedSliceBlock(
  slice: SectionRenderSlice,
  units: LayoutUnit[],
  metrics: PackingMetrics,
  heading: SliceHeading,
  needsLeadingGap: boolean,
  sameSectionPartGap: boolean,
): number {
  const itemSpan =
    slice.itemStart != null && slice.itemEnd != null
      ? slice.itemEnd - slice.itemStart
      : 0;
  const isMergedList =
    itemSpan > 1 && (slice.part === 'full' || slice.part === undefined);
  const categorySpan =
    slice.sectionId === 'skills' &&
    slice.categoryStart != null &&
    slice.categoryEnd != null
      ? slice.categoryEnd - slice.categoryStart
      : 0;
  const isMergedSkillCategories =
    categorySpan > 1 &&
    !slice.commaLineBatch &&
    !slice.commaLineParts?.length;

  if (slice.commaLineBatch || slice.commaLineParts?.length) {
    return measureCommaSkillCoalescedBlock(
      slice,
      units,
      metrics,
      heading,
      needsLeadingGap,
    );
  }

  if (isMergedSkillCategories) {
    return measureSkillCategoryRangeBlock(
      slice,
      units,
      metrics,
      heading,
      needsLeadingGap,
    );
  }

  if (isMergedList) {
    return measureListItemRangeBlock(
      slice,
      units,
      metrics,
      heading,
      needsLeadingGap,
    );
  }

  const unit = findLayoutUnitForSlice(units, slice);
  if (!unit) return 0;
  return measureUnitBlockHeight(
    unit,
    metrics,
    heading,
    needsLeadingGap,
    sameSectionPartGap,
  );
}

export function measurePageContentHeight(
  pageSlices: SectionRenderSlice[],
  isFirstPage: boolean,
  firstPageHeaderPx: number,
  units: LayoutUnit[],
  metrics: PackingMetrics,
): number {
  let used = isFirstPage ? firstPageHeaderPx : 0;
  let lastSectionOnPage: ResumeSectionIdValue | null = null;
  const prefix: SectionRenderSlice[] = [];
  const coalesced = coalesceSlicesForLayout(pageSlices);

  for (const slice of coalesced) {
    const probeUnit =
      findLayoutUnitForSlice(units, slice) ??
      (slice.itemStart != null
        ? findListItemUnit(units, slice.sectionId, slice.itemStart)
        : undefined);
    const hasMergedSkillCategories =
      slice.sectionId === 'skills' &&
      slice.categoryStart != null &&
      slice.categoryEnd != null &&
      slice.categoryEnd - slice.categoryStart > 1;

    if (
      !probeUnit &&
      !slice.commaLineBatch &&
      !slice.commaLineParts?.length &&
      !hasMergedSkillCategories
    ) {
      continue;
    }

    const unit = probeUnit ?? {
      sectionId: slice.sectionId,
      contentHeightPx: 0,
      slice,
    };

    const isFirstSliceOfSectionOnPage = slice.sectionId !== lastSectionOnPage;
    const heading: SliceHeading = {
      needsHeading: shouldRenderSectionHeadingOnPage(
        slice,
        isFirstSliceOfSectionOnPage,
      ),
      showHeading: slice.showHeading,
    };
    const needsLeadingGap = needsLeadingSectionGap(
      prefix,
      lastSectionOnPage,
      unit,
    );
    const sameSectionPartGap = needsSameSectionPartGap(
      prefix,
      lastSectionOnPage,
      unit,
    );
    used += measureCoalescedSliceBlock(
      slice,
      units,
      metrics,
      heading,
      needsLeadingGap,
      sameSectionPartGap,
    );
    prefix.push(slice);
    lastSectionOnPage = slice.sectionId;
  }

  return used;
}

function resolveMovedSliceHeading(
  slice: SectionRenderSlice,
  index: number,
  _priorPages: SectionRenderSlice[][],
  pageSlices: SectionRenderSlice[],
  sectionId: ResumeSectionIdValue,
): SectionRenderSlice {
  if (index !== 0) return slice;
  const earlierOnPage = pageSlices.some((s) => s.sectionId === sectionId);
  return {
    ...slice,
    showHeading: !earlierOnPage,
  };
}

function collectFirstUnitSlices(
  page: SectionRenderSlice[],
  startIndex: number,
  sectionId: ResumeSectionIdValue,
  firstUnitKey: string,
): SectionRenderSlice[] {
  const collected: SectionRenderSlice[] = [];
  for (let index = startIndex; index < page.length; index++) {
    const slice = page[index]!;
    if (slice.sectionId !== sectionId) break;
    if (
      collected.length > 0 &&
      !matchesLayoutUnitKey(slice, sectionId, firstUnitKey)
    ) {
      break;
    }
    if (matchesLayoutUnitKey(slice, sectionId, firstUnitKey)) {
      collected.push(slice);
    }
  }
  return collected;
}

function findSliceInsertIndex(
  pageSlices: SectionRenderSlice[],
  sectionId: ResumeSectionIdValue,
  sectionOrder: ResumeSectionIdValue[],
): number {
  const target = sectionOrder.indexOf(sectionId);
  if (target < 0) return pageSlices.length;
  for (let i = 0; i < pageSlices.length; i++) {
    const sliceOrder = sectionOrder.indexOf(pageSlices[i]!.sectionId);
    if (sliceOrder > target) return i;
  }
  return pageSlices.length;
}

function enforceContinuationAnchors(
  packed: SectionRenderSlice[][],
  manualPages: ResumePageLayout[],
  units: LayoutUnit[],
  firstPageHeaderPx: number,
  metrics: PackingMetrics,
  sectionOrder: ResumeSectionIdValue[],
): SectionRenderSlice[][] {
  const anchors = buildContinuationAnchors(manualPages);
  if (!anchors.size) return packed;

  const result = packed.map((page) => [...page]);
  const maxHeight = metrics.packableHeightPx;

  for (const [sectionId, { primaryPageIndex }] of anchors) {
    if (
      result[primaryPageIndex]?.some((slice) => slice.sectionId === sectionId)
    ) {
      continue;
    }

    const firstUnit = units.find((unit) => unit.sectionId === sectionId);
    if (!firstUnit) continue;

    const firstUnitKey = layoutUnitContinuationKey(firstUnit);
    let sourcePageIndex = -1;
    let sourceStart = -1;

    for (
      let pageIndex = primaryPageIndex + 1;
      pageIndex < result.length;
      pageIndex++
    ) {
      const sliceIndex = result[pageIndex]!.findIndex(
        (slice) => slice.sectionId === sectionId,
      );
      if (sliceIndex >= 0) {
        sourcePageIndex = pageIndex;
        sourceStart = sliceIndex;
        break;
      }
    }

    if (sourcePageIndex < 0) continue;

    const toMove = collectFirstUnitSlices(
      result[sourcePageIndex]!,
      sourceStart,
      sectionId,
      firstUnitKey,
    );
    if (!toMove.length) continue;

    result[sourcePageIndex] = result[sourcePageIndex]!.filter(
      (_, index) => index < sourceStart || index >= sourceStart + toMove.length,
    );

    if (!result[primaryPageIndex]) {
      result[primaryPageIndex] = [];
    }

    const priorPages = result.slice(0, primaryPageIndex);
    const isFirstPage = primaryPageIndex === 0;
    let primaryPage = result[primaryPageIndex]!;
    const evicted: SectionRenderSlice[] = [];

    while (primaryPage.length > 0) {
      const adjustedMove = toMove.map((slice, index) =>
        resolveMovedSliceHeading(
          slice,
          index,
          priorPages,
          primaryPage,
          sectionId,
        ),
      );
      const combined = [...primaryPage, ...adjustedMove];
      const total = measurePageContentHeight(
        combined,
        isFirstPage,
        firstPageHeaderPx,
        units,
        metrics,
      );
      if (total <= maxHeight) break;
      evicted.unshift(primaryPage.pop()!);
    }

    const adjustedMove = toMove.map((slice, index) =>
      resolveMovedSliceHeading(
        slice,
        index,
        priorPages,
        primaryPage,
        sectionId,
      ),
    );
    const insertAt = findSliceInsertIndex(
      primaryPage,
      sectionId,
      sectionOrder,
    );
    primaryPage.splice(insertAt, 0, ...adjustedMove);
    result[primaryPageIndex] = primaryPage;

    const nextPageIndex = primaryPageIndex + 1;
    if (!result[nextPageIndex]) {
      result[nextPageIndex] = [];
    }
    result[nextPageIndex] = reorderPageSlicesBySectionBlocks(
      [...evicted, ...result[nextPageIndex]!],
      sectionOrder,
    );
  }

  while (result.length > 0 && !result[result.length - 1]!.length) {
    result.pop();
  }

  return result.map((page) =>
    reorderPageSlicesBySectionBlocks(page ?? [], sectionOrder),
  );
}

/** @deprecated Use buildLayoutUnits; kept for callers that estimate whole sections. */
export function estimateSectionHeightPx(
  sectionId: ResumeSectionIdValue,
  content: Record<string, unknown>,
  theme?: ResumeTypography,
): number {
  const metrics = resolvePackingMetrics(theme);
  const units = buildLayoutUnits(sectionId, content, metrics);
  let total = metrics.sectionTitleHeightPx;
  for (const unit of units) {
    total += metrics.sectionGapPx + unit.contentHeightPx;
  }
  return total - metrics.sectionGapPx;
}

export function applyPageOverflow(
  manualPages: ResumePageLayout[],
  visibility: Record<string, boolean>,
  sectionContent: Map<ResumeSectionIdValue, Record<string, unknown>>,
  theme?: ResumeTypography,
  continuationOverrides?: Record<string, ContinuationMode>,
  pageMetricsTuning?: PageMetricsTuning | null,
): RenderPage[] {
  const metrics = resolvePackingMetrics(theme, pageMetricsTuning);
  const ordered = flattenVisibleSections(manualPages, visibility);
  const usedIds = new Set<string>();
  for (const page of manualPages) {
    if (page.id) usedIds.add(page.id);
  }

  if (!ordered.length) {
    return [
      {
        id: reservePageId(usedIds, manualPages[0]?.id, 'page', 1),
        sectionIds: [],
        slices: [],
      },
    ];
  }

  const units: LayoutUnit[] = [];
  for (const sectionId of ordered) {
    units.push(
      ...buildLayoutUnits(
        sectionId,
        sectionContent.get(sectionId) ?? {},
        metrics,
      ),
    );
  }

  const packedAnchored = enforceContinuationAnchors(
    packUnitsIntoPages(units, metrics.headerHeightPx, metrics, ordered),
    manualPages,
    units,
    metrics.headerHeightPx,
    metrics,
    ordered,
  );
  const packedRaw = packedAnchored.map((page, pageIndex) =>
    normalizePageSliceShowHeadings(
      packedAnchored.slice(0, pageIndex),
      reorderPageSlicesBySectionBlocks(page ?? [], ordered),
    ),
  );

  const reservedPageIds: string[] = [];
  let manualPageIndex = 0;
  for (let pageIndex = 0; pageIndex < packedRaw.length; pageIndex++) {
    const preferredId = manualPages[manualPageIndex]?.id;
    const isFirstPage = pageIndex === 0;
    reservedPageIds.push(
      reservePageId(
        usedIds,
        preferredId,
        isFirstPage ? 'page' : 'overflow',
        isFirstPage ? 1 : reservedPageIds.length,
      ),
    );
    if (manualPages[manualPageIndex]) manualPageIndex += 1;
  }

  let packed = applyContinuationOverrides(
    packedRaw,
    reservedPageIds,
    continuationOverrides,
    manualPages,
  );
  packed = packed.map((page, pageIndex) =>
    normalizePageSliceShowHeadings(
      packed.slice(0, pageIndex),
      page ?? [],
    ),
  );
  packed = relocateSlicesBeforePrimaryPage(packed, manualPages).map((page) =>
    reorderPageSlicesBySectionBlocks(page ?? [], ordered),
  );

  while (reservedPageIds.length < packed.length) {
    reservedPageIds.push(
      reservePageId(
        usedIds,
        undefined,
        reservedPageIds.length === 0 ? 'page' : 'overflow',
        reservedPageIds.length + 1,
      ),
    );
  }

  const result: RenderPage[] = [];
  for (let pageIndex = 0; pageIndex < packed.length; pageIndex++) {
    const slices = packed[pageIndex] ?? [];
    result.push({
      id:
        reservedPageIds[pageIndex] ??
        reservePageId(
          usedIds,
          undefined,
          pageIndex === 0 ? 'page' : 'overflow',
          pageIndex + 1,
        ),
      sectionIds: slicesToSectionIds(slices),
      slices,
      autoOverflow: pageIndex < packed.length - 1,
    });
  }

  return result;
}
