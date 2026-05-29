import {
  CONTENT_PACKING_SAFETY_PX,
  CV_PAGE_MARGIN_MM,
  resolvePageMetrics,
} from './page-metrics';
import { estimateCommaCharsPerLine } from './estimate-comma-chars-per-line';
import type { PackingMetrics } from './typography-packing-metrics';

/**
 * Runtime overrides for pagination and preview layout.
 * Stored on `JsonLayoutShape.pageMetricsTuning` (editor-only; safe to omit when saving production defaults).
 */
export type PageMetricsTuning = {
  /** Maps to `CV_PAGE_MARGIN_MM` — padding on `.cv-page`. */
  pageMarginMm?: number;
  /** Maps to `CONTENT_PACKING_SAFETY_PX` — subtracted from body max-height. */
  contentPackingSafetyPx?: number;
  /** Direct max stacked content height per page (`packableHeightPx`). */
  packableHeightPx?: number;
  /** Usable horizontal column width for wrapping (`CV_PAGE_CONTENT_WIDTH_PX`). */
  contentWidthPx?: number;
  /** Multiplier on typography-derived comma-line char capacity. */
  charsPerLineScale?: number;
  /** Fixed chars per comma line (overrides scale when set). */
  charsPerLine?: number;
};

export type EffectivePageContentLimits = {
  packableHeightPx: number;
  contentWidthPx: number;
  charsPerLine: number;
  /** Approximate list lines that fit in the vertical budget at current typography. */
  approxLinesPerPage: number;
};

export function resolveCommaCharsPerLine(
  metrics: PackingMetrics,
  tuning?: PageMetricsTuning | null,
): number {
  if (metrics.charsPerLine != null && metrics.charsPerLine > 0) {
    return metrics.charsPerLine;
  }
  if (tuning?.charsPerLine != null && tuning.charsPerLine > 0) {
    return Math.round(tuning.charsPerLine);
  }
  const estimated = estimateCommaCharsPerLine(metrics);
  const scale = tuning?.charsPerLineScale ?? 1;
  return Math.max(24, Math.round(estimated * scale));
}

export function computeEffectivePageContentLimits(
  metrics: PackingMetrics,
  tuning?: PageMetricsTuning | null,
): EffectivePageContentLimits {
  const charsPerLine = resolveCommaCharsPerLine(metrics, tuning);
  const linePx = Math.max(1, metrics.listLineHeightPx);
  const approxLinesPerPage = Math.max(
    1,
    Math.floor(metrics.packableHeightPx / linePx),
  );

  return {
    packableHeightPx: metrics.packableHeightPx,
    contentWidthPx: metrics.contentWidthPx,
    charsPerLine,
    approxLinesPerPage,
  };
}

/** Snippet aligned with `page-metrics.ts` constant names for hardcoding tuned values. */
export function formatPageMetricsTuningCopyBlock(
  tuning: PageMetricsTuning | null | undefined,
  metrics: PackingMetrics,
  limits: EffectivePageContentLimits,
): string {
  const page = resolvePageMetrics(tuning);
  const margin =
    tuning?.pageMarginMm != null
      ? String(tuning.pageMarginMm)
      : `// default ${CV_PAGE_MARGIN_MM}`;
  const safety =
    tuning?.contentPackingSafetyPx != null
      ? String(tuning.contentPackingSafetyPx)
      : `// default ${CONTENT_PACKING_SAFETY_PX}`;
  const packable =
    tuning?.packableHeightPx != null
      ? String(tuning.packableHeightPx)
      : `// effective ${limits.packableHeightPx}`;
  const width =
    tuning?.contentWidthPx != null
      ? String(tuning.contentWidthPx)
      : `// effective ${limits.contentWidthPx}`;
  const chars =
    tuning?.charsPerLine != null
      ? String(tuning.charsPerLine)
      : tuning?.charsPerLineScale != null
        ? `// scale ${tuning.charsPerLineScale} → effective ${limits.charsPerLine}`
        : `// effective ${limits.charsPerLine} (typography-derived)`;

  return [
    '// page-metrics.ts — paste tuned literals',
    `export const CV_PAGE_MARGIN_MM = ${margin};`,
    `export const CONTENT_PACKING_SAFETY_PX = ${safety};`,
    `// A4_PACKABLE_HEIGHT_PX / resolvePackableHeightPx(): ${packable}`,
    `// CV_PAGE_CONTENT_WIDTH_PX: ${width}`,
    `// comma chars per line (estimateCommaCharsPerLine): ${chars}`,
    `// approx list lines per page @ current theme: ${limits.approxLinesPerPage}`,
    `// theme: font ${metrics.fontPx}px, line ${metrics.baseLinePx}px, header ${metrics.headerHeightPx}px`,
    `// resolved body height: ${page.pageBodyHeightPx}px`,
  ].join('\n');
}
