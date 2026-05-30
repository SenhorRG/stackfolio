import { describe, expect, it } from 'vitest';
import { layoutUnitKey, sliceContinuationKey } from './continuation-overrides';
import {
  buildLayoutUnits,
  type SectionRenderSlice,
} from './section-layout-units';
import { nestedListTopMarginPx } from './bullet-line-height';
import { measurePageContentHeight } from './page-overflow';
import { resolvePackingMetrics } from './typography-packing-metrics';

describe('layoutUnitKey', () => {
  it('distinguishes header, bullets, and full item slices', () => {
    const header: SectionRenderSlice = {
      sectionId: 'experience',
      itemStart: 0,
      part: 'header',
      showHeading: true,
    };
    const bullet: SectionRenderSlice = {
      sectionId: 'experience',
      itemStart: 0,
      part: 'bullet',
      bulletIndex: 1,
      showHeading: false,
    };
    expect(layoutUnitKey(header)).toBe('item:0:header');
    expect(layoutUnitKey(bullet)).toBe('item:0:bullet:1');
    expect(sliceContinuationKey(header)).toBe('item:0');
    expect(sliceContinuationKey(bullet)).toBe('item:0');
  });

  it('assigns a unique layoutUnitKey to each splittable experience unit', () => {
    const units = buildLayoutUnits('experience', {
      items: [{ company: 'Acme', bullets: ['One', 'Two', 'Three'] }],
    });
    const keys = units.map((unit) =>
      layoutUnitKey({ ...unit.slice, showHeading: false, sectionId: unit.sectionId }),
    );
    expect(new Set(keys).size).toBe(units.length);
  });

  it('measures bullet slices with bullet line height, not item header height', () => {
    const metrics = resolvePackingMetrics();
    const experience = {
      items: [{ company: 'Acme', bullets: ['One', 'Two', 'Three'] }],
    };
    const units = buildLayoutUnits('experience', experience, metrics);
    const headerUnit = units[0]!;
    const bulletUnit = units[1]!;
    expect(headerUnit.contentHeightPx).toBeGreaterThan(bulletUnit.contentHeightPx);

    const headerAndBullet: SectionRenderSlice[] = [
      { ...headerUnit.slice, showHeading: true },
      { ...bulletUnit.slice, showHeading: false },
    ];
    const headerOnly: SectionRenderSlice[] = [
      { ...headerUnit.slice, showHeading: true },
    ];
    const combinedHeight = measurePageContentHeight(
      headerAndBullet,
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );
    const headerHeight = measurePageContentHeight(
      headerOnly,
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );
    expect(combinedHeight).toBeGreaterThan(headerHeight);
    expect(combinedHeight - headerHeight).toBe(
      nestedListTopMarginPx(metrics) + bulletUnit.contentHeightPx,
    );
  });
});
