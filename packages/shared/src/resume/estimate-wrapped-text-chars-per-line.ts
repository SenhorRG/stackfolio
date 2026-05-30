import { CV_LIST_INDENT_PX } from './bullet-line-height';
import type { PackingMetrics } from './typography-packing-metrics';

export type WrappedTextColumn = 'nested-list' | 'full-width';

function averageCharWidthPx(fontPx: number): number {
  return fontPx * 0.55;
}

/** Character capacity for wrapped text inside a nested list bullet column. */
export function estimateNestedListCharsPerLine(metrics: PackingMetrics): number {
  const usableWidth = metrics.contentWidthPx - CV_LIST_INDENT_PX;
  return Math.max(24, Math.floor(usableWidth / averageCharWidthPx(metrics.fontPx)));
}

/** Character capacity for wrapped text in a full-width block (e.g. `.item-desc`). */
export function estimateFullWidthCharsPerLine(metrics: PackingMetrics): number {
  return Math.max(28, Math.floor(metrics.contentWidthPx / averageCharWidthPx(metrics.fontPx)));
}

export function resolveWrappedTextCharsPerLine(
  metrics: PackingMetrics,
  column: WrappedTextColumn = 'nested-list',
): number {
  return column === 'full-width'
    ? estimateFullWidthCharsPerLine(metrics)
    : estimateNestedListCharsPerLine(metrics);
}
