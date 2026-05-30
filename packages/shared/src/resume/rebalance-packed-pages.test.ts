import { describe, expect, it } from 'vitest';
import type { ResumeSectionIdValue } from '../enums/resume-section';
import { applyPageOverflow, measurePageContentHeight } from './page-overflow';
import { buildLayoutUnits } from './section-layout-units';
import { resolvePackingMetrics } from './typography-packing-metrics';

describe('rebalanceOverflowingPagesOnly via applyPageOverflow', () => {
  it('keeps every render page within the packable height budget after manual-primary relocate', () => {
    const metrics = resolvePackingMetrics();
    const fillerSkills = {
      categories: Array.from({ length: 8 }, (_, categoryIndex) => ({
        label: `Category ${categoryIndex}`,
        display: 'comma' as const,
        skills: Array.from({ length: 12 }, (_, skillIndex) => ({
          name: `Skill ${categoryIndex}-${skillIndex}`,
        })),
      })),
    };
    const experienceItems = Array.from({ length: 12 }, (_, index) => ({
      company: `Company ${index}`,
      role: 'Engineer',
      bullets: ['Line one', 'Line two', 'Line three'],
    }));
    const manualPages = [
      {
        id: 'page-1',
        sectionIds: ['skills'] as ResumeSectionIdValue[],
        continuationSectionIds: ['experience'] as ResumeSectionIdValue[],
      },
      {
        id: 'page-2',
        sectionIds: ['experience'] as ResumeSectionIdValue[],
      },
    ];
    const content = new Map([
      ['skills', fillerSkills],
      ['experience', { items: experienceItems }],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(manualPages, {}, content);
    const units = [
      ...buildLayoutUnits('skills', fillerSkills, metrics),
      ...buildLayoutUnits('experience', { items: experienceItems }, metrics),
    ];

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
