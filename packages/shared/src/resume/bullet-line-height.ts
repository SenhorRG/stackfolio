import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { PackingMetrics } from './typography-packing-metrics';

/** Matches `padding-left: 1.25rem` on `.cv-list` / `.cv-list-nested` at 16px root. */
export const CV_LIST_INDENT_PX = 20;

export type BulletRenderContext = 'split-bullet' | 'full-item';

/**
 * Visual line height for wrapped bullet text in the preview renderer.
 * Experience/education nested `<li>` uses inherited `--cv-line-height` (baseLinePx).
 * Projects/education full-item descriptions use `.item-desc { line-height: 1.35 }`.
 */
export function resolveBulletVisualLineHeightPx(
  sectionId: ResumeSectionIdValue,
  context: BulletRenderContext,
  metrics: PackingMetrics,
): number {
  if (context === 'split-bullet') {
    return metrics.baseLinePx;
  }

  if (sectionId === 'experience') {
    return metrics.baseLinePx;
  }

  if (sectionId === 'education' || sectionId === 'projects') {
    return Math.round(metrics.fontPx * 1.35);
  }

  return metrics.baseLinePx;
}

/** Margin between consecutive nested bullet lines (`li { margin-bottom: 0.12em }`). */
export function nestedBulletItemGapPx(metrics: PackingMetrics): number {
  return Math.round(metrics.fontPx * 0.12);
}

/** Top margin on `.cv-list-nested` after an item header. */
export function nestedListTopMarginPx(metrics: PackingMetrics): number {
  return Math.round(metrics.fontPx * 0.15);
}
