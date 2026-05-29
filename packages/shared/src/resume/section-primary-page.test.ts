import { describe, expect, it } from 'vitest';
import type { ResumeSectionIdValue } from '../enums/resume-section';
import {
  relocateSlicesBeforePrimaryPage,
  sanitizeResumePageContinuations,
} from './section-primary-page';
import { renderPagesToEditorPages } from './sync-render-pages';

describe('sanitizeResumePageContinuations', () => {
  it('removes continuationSectionIds on pages before the section primary page', () => {
    const pages = sanitizeResumePageContinuations([
      {
        id: 'page-1',
        sectionIds: ['skills'] as ResumeSectionIdValue[],
        continuationSectionIds: ['experience'] as ResumeSectionIdValue[],
      },
      {
        id: 'page-2',
        sectionIds: ['experience'] as ResumeSectionIdValue[],
      },
    ]);

    expect(pages[0]!.continuationSectionIds).toBeUndefined();
    expect(pages[1]!.sectionIds).toContain('experience');
  });
});

describe('renderPagesToEditorPages forward-only continuations', () => {
  it('does not mark a section as continuation on a page before its primary page', () => {
    const manualPages = [
      {
        id: 'page-1',
        sectionIds: ['skills'] as ResumeSectionIdValue[],
      },
      {
        id: 'page-2',
        sectionIds: ['experience'] as ResumeSectionIdValue[],
      },
    ];

    const pages = renderPagesToEditorPages(
      [
        {
          id: 'page-1',
          sectionIds: ['skills', 'experience'],
          slices: [{ sectionId: 'experience', showHeading: true }],
        },
        {
          id: 'page-2',
          sectionIds: ['experience'],
          slices: [{ sectionId: 'experience', showHeading: false }],
        },
      ],
      manualPages,
    );

    expect(pages[0]!.continuationSectionIds).toBeUndefined();
    expect(pages[0]!.sectionIds).not.toContain('experience');
    expect(pages[0]!.sectionIds).toEqual(['skills']);
    expect(pages[1]!.continuationSectionIds).toEqual(['experience']);
    expect(pages[1]!.sectionIds).toContain('experience');
  });
});

describe('relocateSlicesBeforePrimaryPage', () => {
  it('moves section slices off pages before the manual primary page', () => {
    const manualPages = [
      { id: 'page-1', sectionIds: ['skills'] as ResumeSectionIdValue[] },
      { id: 'page-2', sectionIds: ['experience'] as ResumeSectionIdValue[] },
    ];
    const packed = relocateSlicesBeforePrimaryPage(
      [
        [
          { sectionId: 'skills', showHeading: true },
          { sectionId: 'experience', showHeading: true },
        ],
        [{ sectionId: 'experience', showHeading: false }],
      ],
      manualPages,
    );

    expect(
      packed[0]!.some((slice) => slice.sectionId === 'experience'),
    ).toBe(false);
    expect(
      packed[1]!.some((slice) => slice.sectionId === 'experience'),
    ).toBe(true);
  });

  it('can grow packed page count when primary manual page index exceeds prior packed length', () => {
    const manualPages = [
      { id: 'page-1', sectionIds: [] as ResumeSectionIdValue[] },
      { id: 'page-2', sectionIds: [] as ResumeSectionIdValue[] },
      { id: 'page-3', sectionIds: ['skills'] as ResumeSectionIdValue[] },
    ];
    const packed = relocateSlicesBeforePrimaryPage(
      [[{ sectionId: 'skills', showHeading: true }]],
      manualPages,
    );

    expect(packed.length).toBe(3);
    expect(
      packed[2]!.some((slice) => slice.sectionId === 'skills'),
    ).toBe(true);
  });
});
