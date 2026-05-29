import type { PackingMetrics } from './typography-packing-metrics';

/** Approximate list indent (`.cv-list` padding-left) in px at current font size. */
function listIndentPx(fontPx: number): number {
  return Math.round(fontPx * 1.15);
}

/**
 * Conservative character capacity for one wrapped comma/list skill line inside
 * the CV content column (matches A4 width minus page margins and list indent).
 */
export function estimateCommaCharsPerLine(metrics: PackingMetrics): number {
  if (metrics.charsPerLine != null && metrics.charsPerLine > 0) {
    return metrics.charsPerLine;
  }
  const avgCharPx = metrics.fontPx * 0.55;
  const usableWidth = metrics.contentWidthPx - listIndentPx(metrics.fontPx);
  return Math.max(24, Math.floor(usableWidth / avgCharPx));
}
