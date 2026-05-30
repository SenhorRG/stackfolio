import { describe, expect, it } from 'vitest';
import type { ResumeSectionIdValue } from '../enums/resume-section';
import {
  applyContinuationOverrides,
  continuationOverrideKey,
  sliceSubsectionKey,
} from './continuation-overrides';
import type { SectionRenderSlice } from './section-layout-units';
import { applyPageOverflow } from './page-overflow';

describe('sliceSubsectionKey', () => {
  it('groups comma line batches under the same skill category', () => {
    expect(
      sliceSubsectionKey({
        sectionId: 'skills',
        showHeading: false,
        categoryStart: 2,
        categoryEnd: 3,
        skillBatchStart: 0,
        skillBatchEnd: 5,
        commaLineBatch: true,
      }),
    ).toBe('cat:2');
  });
});

describe('applyPageOverflow — entire-subsection overrides', () => {
  it('moves an entire experience item to the manual continuation page', () => {
    const content = new Map([
      [
        'experience',
        {
          items: [
            {
              company: 'Acme',
              role: 'Lead',
              period: '2020 – Present',
              bullets: Array.from({ length: 55 }, (_, i) => `Achievement ${i + 1}`),
            },
          ],
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const manualPages = [
      {
        id: 'page-1',
        sectionIds: ['experience'] as ResumeSectionIdValue[],
      },
      {
        id: 'page-2',
        sectionIds: [] as ResumeSectionIdValue[],
        continuationSectionIds: ['experience'] as ResumeSectionIdValue[],
      },
    ];

    const baseline = applyPageOverflow(manualPages, {}, content);
    expect(baseline.length).toBeGreaterThanOrEqual(2);
    expect(
      baseline[0]!.slices.some((slice) => slice.sectionId === 'experience'),
    ).toBe(true);
    expect(
      baseline[1]!.slices.some((slice) => slice.sectionId === 'experience'),
    ).toBe(true);

    const withOverride = applyPageOverflow(
      manualPages,
      {},
      content,
      undefined,
      {
        [continuationOverrideKey('page-2', 'experience')]: 'entire-subsection',
      },
    );

    expect(
      withOverride[0]!.slices.some((slice) => slice.sectionId === 'experience'),
    ).toBe(false);

    const continuationExperience = withOverride
      .slice(1)
      .flatMap((page) => page.slices)
      .filter((slice) => slice.sectionId === 'experience');

    expect(continuationExperience.length).toBeGreaterThan(0);
    expect(
      continuationExperience.every((slice) => slice.itemStart === 0),
    ).toBe(true);
    expect(
      withOverride[1]!.slices.some((slice) => slice.sectionId === 'experience'),
    ).toBe(true);
  });

  it('coalesces split skill category batches into one category block', () => {
    const packed: SectionRenderSlice[][] = [
      [
        {
          sectionId: 'skills',
          showHeading: true,
          categoryStart: 0,
          categoryEnd: 1,
          skillBatchStart: 0,
          skillBatchEnd: 8,
          commaLineBatch: true,
        },
      ],
      [
        {
          sectionId: 'skills',
          showHeading: true,
          categoryStart: 0,
          categoryEnd: 1,
          skillBatchStart: 8,
          skillBatchEnd: 16,
          commaLineBatch: true,
        },
      ],
    ];

    const result = applyContinuationOverrides(
      packed,
      ['page-1', 'page-2'],
      { [continuationOverrideKey('page-2', 'skills')]: 'entire-subsection' },
      [
        { id: 'page-1', sectionIds: ['skills'] },
        {
          id: 'page-2',
          sectionIds: [],
          continuationSectionIds: ['skills'],
        },
      ],
    );

    expect(
      result[0]!.some(
        (slice) => slice.sectionId === 'skills' && slice.categoryStart === 0,
      ),
    ).toBe(false);
    const page2Skills = result[1]!.filter((slice) => slice.sectionId === 'skills');
    expect(page2Skills).toHaveLength(1);
    expect(page2Skills[0]).toMatchObject({
      sectionId: 'skills',
      categoryStart: 0,
      categoryEnd: 1,
    });
    expect(page2Skills[0]?.commaLineBatch).toBeUndefined();
    expect(page2Skills[0]?.skillBatchStart).toBeUndefined();
  });

  it('coalesces only the boundary subsection when two items span the page break', () => {
    const packed: SectionRenderSlice[][] = [
      [
        {
          sectionId: 'experience',
          showHeading: true,
          itemStart: 0,
          itemEnd: 1,
          part: 'header',
        },
        {
          sectionId: 'experience',
          showHeading: false,
          itemStart: 0,
          itemEnd: 1,
          part: 'bullet',
          bulletIndex: 0,
        },
        {
          sectionId: 'experience',
          showHeading: false,
          itemStart: 1,
          itemEnd: 2,
          part: 'header',
        },
      ],
      [
        {
          sectionId: 'experience',
          showHeading: false,
          itemStart: 0,
          itemEnd: 1,
          part: 'bullet',
          bulletIndex: 1,
        },
        {
          sectionId: 'experience',
          showHeading: false,
          itemStart: 1,
          itemEnd: 2,
          part: 'bullet',
          bulletIndex: 0,
        },
      ],
    ];

    const result = applyContinuationOverrides(
      packed,
      ['page-1', 'page-2'],
      { [continuationOverrideKey('page-2', 'experience')]: 'entire-subsection' },
      [
        { id: 'page-1', sectionIds: ['experience'] },
        {
          id: 'page-2',
          sectionIds: [],
          continuationSectionIds: ['experience'],
        },
      ],
    );

    expect(
      result[0]!.some(
        (slice) =>
          slice.sectionId === 'experience' &&
          slice.itemStart === 0 &&
          slice.part === 'header',
      ),
    ).toBe(true);
    expect(
      result[0]!.some(
        (slice) =>
          slice.sectionId === 'experience' &&
          slice.itemStart === 0 &&
          slice.part === 'bullet',
      ),
    ).toBe(true);
    expect(
      result[0]!.some(
        (slice) => slice.sectionId === 'experience' && slice.itemStart === 1,
      ),
    ).toBe(false);

    const page2Item1 = result[1]!.filter(
      (slice) => slice.sectionId === 'experience' && slice.itemStart === 1,
    );
    expect(page2Item1).toHaveLength(1);
    expect(page2Item1[0]).toMatchObject({
      itemStart: 1,
      itemEnd: 2,
      part: 'full',
    });
    expect(
      result[1]!.some(
        (slice) => slice.sectionId === 'experience' && slice.itemStart === 0,
      ),
    ).toBe(true);
  });
});
