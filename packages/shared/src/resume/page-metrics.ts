/** A4 page layout — keep in sync with `.cv-page` in cv-preview.renderer.ts */

import type { PageMetricsTuning } from './page-metrics-tuning';

export const CV_PAGE_MARGIN_MM = 12;
export const CV_PAGE_WIDTH_MM = 210;
export const CV_PAGE_HEIGHT_MM = 297;

const MM_TO_PX = 96 / 25.4;

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

/** Vertical padding on `.cv-page` (top and bottom). */
export const CV_PAGE_VERTICAL_MARGIN_PX = mmToPx(CV_PAGE_MARGIN_MM);

/** Body area between top and bottom page margins (border-box content box). */
export const CV_PAGE_BODY_HEIGHT_PX = mmToPx(
  CV_PAGE_HEIGHT_MM - 2 * CV_PAGE_MARGIN_MM,
);

/** Usable horizontal width inside `.cv-page` padding (list/text wrapping). */
export const CV_PAGE_CONTENT_WIDTH_PX = mmToPx(
  CV_PAGE_WIDTH_MM - 2 * CV_PAGE_MARGIN_MM,
);

/**
 * Max stacked content height per page for layout packing.
 * Matches `.cv-page-body` max-height; bottom page margin is already
 * outside this box via `.cv-page` padding.
 */
export const A4_CONTENT_HEIGHT_PX = CV_PAGE_BODY_HEIGHT_PX;

/**
 * Small anti-clip buffer when height estimates undershoot rendered CSS.
 * Keep aligned with clip/margin work — do not stack large buffers.
 */
export const CONTENT_PACKING_SAFETY_PX = 4;

/** Default usable height for {@link applyPageOverflow} (typography-neutral). */
export const A4_PACKABLE_HEIGHT_PX =
  A4_CONTENT_HEIGHT_PX - CONTENT_PACKING_SAFETY_PX;

/** Stacked content budget inside `.cv-page-body` (matches renderer padding-bottom). */
export function resolvePackableHeightPx(
  tuning?: PageMetricsTuning | null,
): number {
  return resolvePageMetrics(tuning).packableHeightPx;
}

export type ResolvedPageMetrics = {
  pageMarginMm: number;
  pageBodyHeightPx: number;
  contentHeightPx: number;
  contentWidthPx: number;
  contentPackingSafetyPx: number;
  packableHeightPx: number;
};

export function resolvePageMetrics(
  tuning?: PageMetricsTuning | null,
): ResolvedPageMetrics {
  const pageMarginMm = tuning?.pageMarginMm ?? CV_PAGE_MARGIN_MM;
  const contentPackingSafetyPx =
    tuning?.contentPackingSafetyPx ?? CONTENT_PACKING_SAFETY_PX;
  const pageBodyHeightPx = mmToPx(CV_PAGE_HEIGHT_MM - 2 * pageMarginMm);
  const contentWidthPx =
    tuning?.contentWidthPx ??
    mmToPx(CV_PAGE_WIDTH_MM - 2 * pageMarginMm);
  const contentHeightPx = pageBodyHeightPx;
  const packableHeightPx =
    tuning?.packableHeightPx ??
    contentHeightPx - contentPackingSafetyPx;

  return {
    pageMarginMm,
    pageBodyHeightPx,
    contentHeightPx,
    contentWidthPx,
    contentPackingSafetyPx,
    packableHeightPx,
  };
}
