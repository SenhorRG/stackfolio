import {
  nestedBulletItemGapPx,
  nestedListTopMarginPx,
} from './bullet-line-height';
import type { SectionRenderSlice } from './section-layout-units';
import type { PackingMetrics } from './typography-packing-metrics';

function isSameListItem(
  previous: SectionRenderSlice,
  current: SectionRenderSlice,
): boolean {
  return (
    previous.sectionId === current.sectionId &&
    previous.itemStart != null &&
    previous.itemStart === current.itemStart
  );
}

/** Vertical gap between consecutive slices on one page (matches cv-preview CSS). */
export function resolveSlicePairGapPx(
  previous: SectionRenderSlice,
  current: SectionRenderSlice,
  metrics: PackingMetrics,
): number {
  if (previous.sectionId !== current.sectionId) {
    return 0;
  }

  if (isSameListItem(previous, current)) {
    const previousPart = previous.part ?? 'full';
    const currentPart = current.part ?? 'full';
    if (previousPart === 'header' && currentPart === 'bullet') {
      return nestedListTopMarginPx(metrics);
    }
    if (previousPart === 'bullet' && currentPart === 'bullet') {
      return nestedBulletItemGapPx(metrics);
    }
  }

  return metrics.sectionPartGapPx;
}
