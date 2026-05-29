import { describe, expect, it } from 'vitest';
import {
  coalesceCommaSkillLineSlices,
  coalesceFullListItemSlices,
  coalesceSkillCategorySlices,
  coalesceSlicesForLayout,
} from './coalesce-slice-batches';
import type { SectionRenderSlice } from './section-layout-units';

describe('coalesceCommaSkillLineSlices', () => {
  it('merges adjacent comma line batches in the same category', () => {
    const slices: SectionRenderSlice[] = [
      {
        sectionId: 'skills',
        showHeading: true,
        categoryStart: 0,
        categoryEnd: 1,
        skillBatchStart: 0,
        skillBatchEnd: 5,
        commaLineBatch: true,
      },
      {
        sectionId: 'skills',
        showHeading: false,
        categoryStart: 0,
        categoryEnd: 1,
        skillBatchStart: 5,
        skillBatchEnd: 10,
        commaLineBatch: true,
      },
    ];
    const merged = coalesceCommaSkillLineSlices(slices);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.skillBatchEnd).toBe(10);
    expect(merged[0]?.commaLineParts).toHaveLength(2);
  });
});

describe('coalesceFullListItemSlices', () => {
  it('merges consecutive experience items with the same heading flag', () => {
    const slices: SectionRenderSlice[] = [
      {
        sectionId: 'experience',
        showHeading: true,
        itemStart: 0,
        itemEnd: 1,
        part: 'full',
      },
      {
        sectionId: 'experience',
        showHeading: false,
        itemStart: 1,
        itemEnd: 2,
        part: 'full',
      },
      {
        sectionId: 'experience',
        showHeading: false,
        itemStart: 2,
        itemEnd: 3,
        part: 'full',
      },
    ];
    const merged = coalesceFullListItemSlices(slices);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.itemStart).toBe(0);
    expect(merged[0]?.itemEnd).toBe(3);
  });

  it('does not merge slices from different sections', () => {
    const slices: SectionRenderSlice[] = [
      {
        sectionId: 'skills',
        showHeading: true,
        itemStart: 0,
        itemEnd: 1,
        part: 'full',
      },
      {
        sectionId: 'experience',
        showHeading: true,
        itemStart: 0,
        itemEnd: 1,
        part: 'full',
      },
    ];
    expect(coalesceFullListItemSlices(slices)).toHaveLength(2);
  });
});

describe('coalesceSkillCategorySlices', () => {
  it('merges adjacent skill categories into one section block', () => {
    const slices: SectionRenderSlice[] = [
      {
        sectionId: 'skills',
        showHeading: true,
        categoryStart: 0,
        categoryEnd: 1,
      },
      {
        sectionId: 'skills',
        showHeading: false,
        categoryStart: 1,
        categoryEnd: 2,
      },
      {
        sectionId: 'skills',
        showHeading: false,
        categoryStart: 2,
        categoryEnd: 3,
      },
    ];
    const merged = coalesceSkillCategorySlices(slices);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.categoryStart).toBe(0);
    expect(merged[0]?.categoryEnd).toBe(3);
  });
});

describe('coalesceSlicesForLayout', () => {
  it('applies comma then list coalescing', () => {
    const slices: SectionRenderSlice[] = [
      {
        sectionId: 'skills',
        showHeading: true,
        categoryStart: 0,
        categoryEnd: 1,
        skillBatchStart: 0,
        skillBatchEnd: 3,
        commaLineBatch: true,
      },
      {
        sectionId: 'skills',
        showHeading: false,
        categoryStart: 0,
        categoryEnd: 1,
        skillBatchStart: 3,
        skillBatchEnd: 6,
        commaLineBatch: true,
      },
      {
        sectionId: 'experience',
        showHeading: true,
        itemStart: 0,
        itemEnd: 1,
        part: 'full',
      },
      {
        sectionId: 'experience',
        showHeading: false,
        itemStart: 1,
        itemEnd: 2,
        part: 'full',
      },
    ];
    const merged = coalesceSlicesForLayout(slices);
    expect(merged).toHaveLength(2);
    expect(merged[0]?.sectionId).toBe('skills');
    expect(merged[1]?.itemEnd).toBe(2);
  });
});
