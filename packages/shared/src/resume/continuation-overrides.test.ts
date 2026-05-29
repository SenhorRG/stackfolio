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

    const page2Experience = withOverride[1]!.slices.filter(
      (slice) => slice.sectionId === 'experience',
    );
    expect(page2Experience).toHaveLength(1);
    expect(page2Experience[0]?.part).toBe('full');
    expect(page2Experience[0]?.itemStart).toBe(0);
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
});
