import type { ResumeSectionIdValue } from '../enums/resume-section';
import {
  nestedBulletItemGapPx,
  nestedListTopMarginPx,
} from './bullet-line-height';
import type { LayoutUnit, SectionRenderSlice } from './section-layout-units';
import type { PackingMetrics } from './typography-packing-metrics';

const SPLITTABLE_LIST_SECTIONS = new Set<ResumeSectionIdValue>([
  'experience',
  'education',
]);

function findListItemUnit(
  units: LayoutUnit[],
  sectionId: ResumeSectionIdValue,
  itemIndex: number,
  part: SectionRenderSlice['part'] = 'full',
): LayoutUnit | undefined {
  return units.find(
    (unit) =>
      unit.sectionId === sectionId &&
      unit.slice.itemStart === itemIndex &&
      (unit.slice.part ?? 'full') === part,
  );
}

function listBulletUnitsForItem(
  units: LayoutUnit[],
  sectionId: ResumeSectionIdValue,
  itemIndex: number,
): LayoutUnit[] {
  return units.filter(
    (unit) =>
      unit.sectionId === sectionId &&
      unit.slice.itemStart === itemIndex &&
      unit.slice.part === 'bullet',
  );
}

/** Height of one list item from layout units (full, or header + bullets). */
export function measureSplittableItemHeightPx(
  sectionId: ResumeSectionIdValue,
  itemIndex: number,
  units: LayoutUnit[],
  metrics: PackingMetrics,
): number {
  if (!SPLITTABLE_LIST_SECTIONS.has(sectionId)) return 0;

  const fullUnit = findListItemUnit(units, sectionId, itemIndex, 'full');
  if (fullUnit) return fullUnit.contentHeightPx;

  const headerUnit = findListItemUnit(units, sectionId, itemIndex, 'header');
  const bulletUnits = listBulletUnitsForItem(units, sectionId, itemIndex);

  let height = headerUnit?.contentHeightPx ?? 0;
  const bulletGapPx = nestedBulletItemGapPx(metrics);

  for (let index = 0; index < bulletUnits.length; index++) {
    if (index === 0 && headerUnit) {
      height += nestedListTopMarginPx(metrics);
    } else if (index > 0) {
      height += bulletGapPx;
    }
    height += bulletUnits[index]!.contentHeightPx;
  }

  return height;
}
