import { describe, expect, it } from 'vitest';
import type { ResumeSectionIdValue } from '../enums/resume-section';
import { continuationOverrideKey } from './continuation-overrides';
import { applyPageOverflow, measurePageContentHeight } from './page-overflow';
import { buildLayoutUnits } from './section-layout-units';
import { resolvePackingMetrics } from './typography-packing-metrics';

describe('applyPageOverflow — entire-subsection rebalance', () => {
  it('keeps continuation pages within budget after coalescing a full experience item', () => {
    const metrics = resolvePackingMetrics();
    const experience = {
      items: [
        {
          company: 'Acme',
          role: 'Lead',
          period: '2020 – Present',
          bullets: Array.from({ length: 55 }, (_, i) => `Achievement ${i + 1}`),
        },
      ],
    };
    const content = new Map([
      ['experience', experience],
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
    const units = buildLayoutUnits('experience', experience, metrics);

    const pages = applyPageOverflow(
      manualPages,
      {},
      content,
      undefined,
      {
        [continuationOverrideKey('page-2', 'experience')]: 'entire-subsection',
      },
    );

    expect(pages[0]!.slices.some((s) => s.sectionId === 'experience')).toBe(
      false,
    );
    expect(pages.length).toBeGreaterThan(2);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const used = measurePageContentHeight(
        pages[pageIndex]!.slices,
        pageIndex === 0,
        metrics.headerHeightPx,
        units,
        metrics,
      );
      expect(used).toBeLessThanOrEqual(metrics.packableHeightPx);
    }
  });
});
