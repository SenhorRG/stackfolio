import { describe, expect, it } from 'vitest';
import { coalesceSlicesForLayout } from './coalesce-slice-batches';
import { shouldRenderSectionHeadingOnPage } from './should-render-section-heading-on-page';
import type { SectionRenderSlice } from './section-layout-units';

function headingFlagsForPage(slices: SectionRenderSlice[]): boolean[] {
  const coalesced = coalesceSlicesForLayout(slices);
  let lastSection: SectionRenderSlice['sectionId'] | null = null;
  return coalesced.map((slice) => {
    const isFirstOfSectionOnPage = slice.sectionId !== lastSection;
    lastSection = slice.sectionId;
    return shouldRenderSectionHeadingOnPage(slice, isFirstOfSectionOnPage);
  });
}

describe('shouldRenderSectionHeadingOnPage', () => {
  it('renders h2 for the document-first slice when showHeading is true', () => {
    expect(
      shouldRenderSectionHeadingOnPage(
        { sectionId: 'experience', showHeading: true },
        true,
      ),
    ).toBe(true);
  });

  it('renders h2 for the first slice of a section on each page', () => {
    expect(
      shouldRenderSectionHeadingOnPage(
        { sectionId: 'skills', showHeading: false, categoryStart: 0 },
        true,
      ),
    ).toBe(true);
  });

  it('does not render h2 for later slices of the same section on one page', () => {
    expect(
      shouldRenderSectionHeadingOnPage(
        { sectionId: 'skills', showHeading: false, categoryStart: 1 },
        false,
      ),
    ).toBe(false);
  });

  it('does not render h2 when slice is not first on the page', () => {
    expect(
      shouldRenderSectionHeadingOnPage(
        { sectionId: 'experience', showHeading: true, itemStart: 4, itemEnd: 5 },
        false,
      ),
    ).toBe(false);
  });

  it('emits at most one h2 per section per page after coalescing', () => {
    const page2Slices: SectionRenderSlice[] = [
      {
        sectionId: 'experience',
        showHeading: true,
        itemStart: 3,
        part: 'header',
      },
      {
        sectionId: 'experience',
        showHeading: false,
        itemStart: 3,
        part: 'bullet',
        bulletIndex: 0,
      },
    ];
    expect(headingFlagsForPage(page2Slices)).toEqual([true, false]);
  });

  it('renders skills h2 once for coalesced continuation lines on page 2', () => {
    const page2Slices: SectionRenderSlice[] = [
      {
        sectionId: 'skills',
        showHeading: true,
        categoryStart: 0,
        categoryEnd: 1,
        skillBatchStart: 8,
        skillBatchEnd: 12,
        commaLineBatch: true,
      },
      {
        sectionId: 'skills',
        showHeading: false,
        categoryStart: 0,
        categoryEnd: 1,
        skillBatchStart: 12,
        skillBatchEnd: 16,
        commaLineBatch: true,
      },
    ];
    const flags = headingFlagsForPage(page2Slices);
    expect(flags).toEqual([true]);
  });

  it('renders h2 when a section starts on the page after partial skills', () => {
    const pageSlices: SectionRenderSlice[] = [
      {
        sectionId: 'skills',
        showHeading: true,
        categoryStart: 0,
        categoryEnd: 1,
        skillBatchStart: 0,
        skillBatchEnd: 8,
        commaLineBatch: true,
      },
      {
        sectionId: 'experience',
        showHeading: true,
        itemStart: 0,
        itemEnd: 1,
        part: 'full',
      },
    ];
    expect(headingFlagsForPage(pageSlices)).toEqual([true, true]);
  });
});
