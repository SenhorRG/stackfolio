import type { ResumeTypography } from './layout-types';
import { CV_PAGE_CONTENT_WIDTH_PX } from './page-metrics';
import type { PageMetricsTuning } from './page-metrics-tuning';
import { resolveCommaCharsPerLine } from './page-metrics-tuning';
import { resolvePageMetrics } from './page-metrics';
import { getTheme } from './theme';

/** Converts CSS pt to screen px at 96dpi (matches browser pt rendering). */
export function ptToPx(pt: number): number {
  return Math.round(pt * (96 / 72));
}

export function parsePt(value: string): number {
  const match = value.trim().match(/^([\d.]+)pt$/);
  return match ? parseFloat(match[1]!) : 11;
}

export type PackingMetrics = {
  packableHeightPx: number;
  contentWidthPx: number;
  /** When set, used by comma-line batching instead of width-derived estimate. */
  charsPerLine?: number;
  headerHeightPx: number;
  fontPx: number;
  baseLinePx: number;
  /** `.cv-list > li` line box including margin-bottom (0.12em). */
  listLineHeightPx: number;
  sectionGapPx: number;
  sectionTitleHeightPx: number;
  sectionPartGapPx: number;
  bulletLineHeightPx: number;
  listItemHeaderHeightPx: number;
};

export function resolvePackingMetrics(
  theme?: ResumeTypography,
  pageMetricsTuning?: PageMetricsTuning | null,
): PackingMetrics {
  const resolved = theme ?? getTheme({});
  const page = resolvePageMetrics(pageMetricsTuning);

  const fontPx = ptToPx(parsePt(resolved.fontSize));
  const baseLinePx = ptToPx(parsePt(resolved.lineHeight));
  const sectionGapPx = ptToPx(parsePt(resolved.sectionGap));

  const sectionTitleHeightPx = Math.round(
    fontPx * 0.85 + fontPx * 0.75 + 4 + fontPx * 0.8,
  );
  const sectionPartGapPx = Math.round(
    baseLinePx * 0.15 + sectionGapPx * 0.08,
  );
  const listLineHeightPx = Math.round(baseLinePx + fontPx * 0.12);
  const listItemHeaderHeightPx = Math.round(baseLinePx * 1.45 + fontPx * 0.25);
  const headerHeightPx = Math.round(fontPx * 1.5 + baseLinePx * 2 + sectionGapPx);

  const metrics: PackingMetrics = {
    packableHeightPx: page.packableHeightPx,
    contentWidthPx: page.contentWidthPx ?? CV_PAGE_CONTENT_WIDTH_PX,
    headerHeightPx,
    fontPx,
    baseLinePx,
    listLineHeightPx,
    sectionGapPx,
    sectionTitleHeightPx,
    sectionPartGapPx,
    bulletLineHeightPx: listLineHeightPx,
    listItemHeaderHeightPx,
    charsPerLine: resolveCommaCharsPerLine(
      {
        packableHeightPx: page.packableHeightPx,
        contentWidthPx: page.contentWidthPx ?? CV_PAGE_CONTENT_WIDTH_PX,
        headerHeightPx,
        fontPx,
        baseLinePx,
        listLineHeightPx,
        sectionGapPx,
        sectionTitleHeightPx,
        sectionPartGapPx,
        bulletLineHeightPx: listLineHeightPx,
        listItemHeaderHeightPx,
      },
      pageMetricsTuning,
    ),
  };

  return metrics;
}

const DEFAULT_METRICS = resolvePackingMetrics();

/** @deprecated Use resolvePackingMetrics().baseLinePx */
export const BASE_LINE_PX = DEFAULT_METRICS.baseLinePx;

/** @deprecated Use resolvePackingMetrics().sectionTitleHeightPx */
export const SECTION_TITLE_HEIGHT_PX = DEFAULT_METRICS.sectionTitleHeightPx;

/** @deprecated Use resolvePackingMetrics().sectionGapPx */
export const SECTION_GAP_PX = DEFAULT_METRICS.sectionGapPx;

/** @deprecated Use resolvePackingMetrics().bulletLineHeightPx */
export const BULLET_LINE_HEIGHT_PX = DEFAULT_METRICS.bulletLineHeightPx;

/** @deprecated Use resolvePackingMetrics().listItemHeaderHeightPx */
export const LIST_ITEM_HEADER_HEIGHT_PX = DEFAULT_METRICS.listItemHeaderHeightPx;

/** @deprecated Use resolvePackingMetrics().headerHeightPx */
export const HEADER_HEIGHT_PX = DEFAULT_METRICS.headerHeightPx;
