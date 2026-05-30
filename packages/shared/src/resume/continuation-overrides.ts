import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { SectionRenderSlice } from './section-layout-units';
import type { ContinuationMode, ResumePageLayout } from './layout-types';
import { buildPrimarySectionPageIndex } from './section-primary-page';

export type { ContinuationMode };

export function continuationOverrideKey(
  pageId: string,
  sectionId: ResumeSectionIdValue,
): string {
  return `${pageId}:${sectionId}`;
}

export function parseContinuationOverrideKey(
  key: string,
): { pageId: string; sectionId: ResumeSectionIdValue } | null {
  const colon = key.indexOf(':');
  if (colon <= 0) return null;
  return {
    pageId: key.slice(0, colon),
    sectionId: key.slice(colon + 1) as ResumeSectionIdValue,
  };
}

export function getContinuationMode(
  overrides: Record<string, ContinuationMode> | undefined,
  pageId: string,
  sectionId: ResumeSectionIdValue,
): ContinuationMode {
  return (
    overrides?.[continuationOverrideKey(pageId, sectionId)] ?? 'overflow-only'
  );
}

/** Logical sub-section for entire-subsection continuation (item, category, etc.). */
export function sliceSubsectionKey(slice: SectionRenderSlice): string {
  if (slice.itemStart !== undefined) return `item:${slice.itemStart}`;
  if (slice.categoryStart !== undefined) return `cat:${slice.categoryStart}`;
  if (slice.skillBatchStart !== undefined) return `batch:${slice.skillBatchStart}`;
  return 'section';
}

export function matchesSubsectionKey(
  slice: SectionRenderSlice,
  sectionId: ResumeSectionIdValue,
  key: string,
): boolean {
  return slice.sectionId === sectionId && sliceSubsectionKey(slice) === key;
}

/** Groups slices for continuation overrides (entire item / category). */
export function sliceContinuationKey(slice: SectionRenderSlice): string {
  if (slice.itemStart !== undefined) return `item:${slice.itemStart}`;
  if (slice.categoryStart !== undefined) {
    if (slice.skillBatchStart !== undefined) {
      return `cat:${slice.categoryStart}:batch:${slice.skillBatchStart}`;
    }
    return `cat:${slice.categoryStart}`;
  }
  if (slice.skillBatchStart !== undefined) {
    return `batch:${slice.skillBatchStart}`;
  }
  return 'section';
}

/** Unique key per layout unit (header vs bullets, comma line batches, etc.). */
export function layoutUnitKey(slice: SectionRenderSlice): string {
  if (slice.itemStart !== undefined) {
    const part = slice.part ?? 'full';
    if (part === 'bullet' && slice.bulletIndex !== undefined) {
      return `item:${slice.itemStart}:bullet:${slice.bulletIndex}`;
    }
    if (part === 'header') {
      return `item:${slice.itemStart}:header`;
    }
    return `item:${slice.itemStart}:full`;
  }
  if (slice.categoryStart !== undefined) {
    if (slice.skillBatchStart !== undefined) {
      return `cat:${slice.categoryStart}:batch:${slice.skillBatchStart}`;
    }
    return `cat:${slice.categoryStart}`;
  }
  if (slice.skillBatchStart !== undefined) {
    return `batch:${slice.skillBatchStart}`;
  }
  return 'section';
}

export function matchesContinuationKey(
  slice: SectionRenderSlice,
  sectionId: ResumeSectionIdValue,
  key: string,
): boolean {
  return slice.sectionId === sectionId && sliceContinuationKey(slice) === key;
}

export function matchesLayoutUnitKey(
  slice: SectionRenderSlice,
  sectionId: ResumeSectionIdValue,
  key: string,
): boolean {
  return slice.sectionId === sectionId && layoutUnitKey(slice) === key;
}

function buildCoalescedSlice(
  template: SectionRenderSlice,
  showHeading: boolean,
): SectionRenderSlice {
  if (template.itemStart !== undefined) {
    return {
      sectionId: template.sectionId,
      itemStart: template.itemStart,
      itemEnd: template.itemEnd ?? template.itemStart + 1,
      part: 'full',
      showHeading,
    };
  }
  if (template.categoryStart !== undefined) {
    return {
      sectionId: template.sectionId,
      categoryStart: template.categoryStart,
      categoryEnd: template.categoryEnd ?? template.categoryStart + 1,
      showHeading,
    };
  }
  if (template.skillBatchStart !== undefined) {
    return {
      sectionId: template.sectionId,
      skillBatchStart: template.skillBatchStart,
      skillBatchEnd: template.skillBatchEnd,
      showHeading,
    };
  }
  return {
    sectionId: template.sectionId,
    showHeading,
  };
}

function resolveCoalescedShowHeading(
  packed: SectionRenderSlice[][],
  pageIndex: number,
  sectionId: ResumeSectionIdValue,
  insertIndex: number,
): boolean {
  const page = packed[pageIndex]!;
  const earlierOnPage = page
    .slice(0, insertIndex)
    .some((s) => s.sectionId === sectionId);
  return !earlierOnPage;
}

/** Sub-section split at the page boundary (last on prior page, continues on current). */
export function resolveBoundarySubsectionKey(
  packed: SectionRenderSlice[][],
  pageIndex: number,
  sectionId: ResumeSectionIdValue,
): string | null {
  if (pageIndex <= 0) return null;

  const priorPage = packed[pageIndex - 1];
  if (!priorPage?.length) return null;

  let lastSectionSlice: SectionRenderSlice | null = null;
  for (let index = priorPage.length - 1; index >= 0; index -= 1) {
    const slice = priorPage[index]!;
    if (slice.sectionId === sectionId) {
      lastSectionSlice = slice;
      break;
    }
  }
  if (!lastSectionSlice) return null;

  const key = sliceSubsectionKey(lastSectionSlice);
  const continuesOnPage = packed[pageIndex]!.some((slice) =>
    matchesSubsectionKey(slice, sectionId, key),
  );
  return continuesOnPage ? key : null;
}

function coalesceEntireSubsectionOnPage(
  packed: SectionRenderSlice[][],
  pageIndex: number,
  sectionId: ResumeSectionIdValue,
): void {
  const key = resolveBoundarySubsectionKey(packed, pageIndex, sectionId);
  if (!key) return;

  for (let pi = 0; pi < pageIndex; pi++) {
    packed[pi] = packed[pi]!.filter(
      (s) => !matchesSubsectionKey(s, sectionId, key),
    );
  }

  const target = packed[pageIndex]!;
  const firstIndex = target.findIndex((s) =>
    matchesSubsectionKey(s, sectionId, key),
  );
  if (firstIndex < 0) return;

  const template = target[firstIndex]!;
  const showHeading = resolveCoalescedShowHeading(
    packed,
    pageIndex,
    sectionId,
    firstIndex,
  );
  const coalesced = buildCoalescedSlice(template, showHeading);
  const without = target.filter(
    (s) => !matchesSubsectionKey(s, sectionId, key),
  );
  const insertAt = Math.min(firstIndex, without.length);
  without.splice(insertAt, 0, coalesced);
  packed[pageIndex] = without;
}

function resolveContinuationOverridePageIndex(
  sectionId: ResumeSectionIdValue,
  manualPageId: string,
  pageIds: string[],
  manualPages: ResumePageLayout[],
  packed: SectionRenderSlice[][],
): number {
  const manualIndex = manualPages.findIndex((page) => page.id === manualPageId);
  if (manualIndex < 0) return pageIds.indexOf(manualPageId);

  for (let pageIndex = manualIndex; pageIndex < packed.length; pageIndex++) {
    const page = packed[pageIndex] ?? [];
    const hasSection = page.some((slice) => slice.sectionId === sectionId);
    if (!hasSection) continue;

    const continuedFromEarlier = packed
      .slice(0, pageIndex)
      .some((prior) => prior.some((slice) => slice.sectionId === sectionId));
    if (continuedFromEarlier) return pageIndex;
  }

  return pageIds.indexOf(manualPageId);
}

export function applyContinuationOverrides(
  packed: SectionRenderSlice[][],
  pageIds: string[],
  overrides: Record<string, ContinuationMode> | undefined,
  manualPages: ResumePageLayout[] = [],
): SectionRenderSlice[][] {
  if (!overrides || !Object.keys(overrides).length) {
    return packed;
  }

  const primaryBySection = buildPrimarySectionPageIndex(manualPages);
  const result = packed.map((page) => [...page]);

  for (const [key, mode] of Object.entries(overrides)) {
    if (mode !== 'entire-subsection') continue;
    const parsed = parseContinuationOverrideKey(key);
    if (!parsed) continue;
    const pageIndex = resolveContinuationOverridePageIndex(
      parsed.sectionId,
      parsed.pageId,
      pageIds,
      manualPages,
      result,
    );
    if (pageIndex < 0) continue;
    const primaryPageIndex = primaryBySection.get(parsed.sectionId);
    if (
      primaryPageIndex !== undefined &&
      pageIndex <= primaryPageIndex
    ) {
      continue;
    }
    coalesceEntireSubsectionOnPage(result, pageIndex, parsed.sectionId);
  }

  return result;
}
