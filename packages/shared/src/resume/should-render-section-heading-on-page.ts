import type { SectionRenderSlice } from './section-layout-units';

/**
 * First coalesced slice of a section on this page renders the section h2,
 * including cross-page continuations.
 */
export function shouldRenderSectionHeadingOnPage(
  _slice: SectionRenderSlice,
  isFirstSliceOfSectionOnPage: boolean,
): boolean {
  return isFirstSliceOfSectionOnPage;
}
