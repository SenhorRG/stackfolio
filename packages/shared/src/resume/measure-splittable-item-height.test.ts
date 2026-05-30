import { describe, expect, it } from 'vitest';
import { measurePageContentHeight } from './page-overflow';
import { buildLayoutUnits } from './section-layout-units';
import { resolvePackingMetrics } from './typography-packing-metrics';
import { measureSplittableItemHeightPx } from './measure-splittable-item-height';

describe('measureSplittableItemHeightPx', () => {
  it('sums header and bullet units for coalesced full-item measurement', () => {
    const metrics = resolvePackingMetrics();
    const experience = {
      items: [{ company: 'Acme', bullets: ['One', 'Two', 'Three'] }],
    };
    const units = buildLayoutUnits('experience', experience, metrics);
    const itemHeight = measureSplittableItemHeightPx('experience', 0, units, metrics);

    const fullSliceHeight = measurePageContentHeight(
      [
        {
          sectionId: 'experience',
          itemStart: 0,
          itemEnd: 1,
          part: 'full',
          showHeading: true,
        },
      ],
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );

    expect(itemHeight).toBeGreaterThan(metrics.listItemHeaderHeightPx);
    expect(fullSliceHeight).toBeGreaterThan(metrics.headerHeightPx + itemHeight);
  });
});
