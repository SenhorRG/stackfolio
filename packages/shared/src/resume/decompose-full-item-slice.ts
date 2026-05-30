import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { LayoutUnit, SectionRenderSlice } from './section-layout-units';

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
  return units
    .filter(
      (unit) =>
        unit.sectionId === sectionId &&
        unit.slice.itemStart === itemIndex &&
        unit.slice.part === 'bullet',
    )
    .sort(
      (a, b) => (a.slice.bulletIndex ?? 0) - (b.slice.bulletIndex ?? 0),
    );
}

/**
 * Expands a coalesced `part: 'full'` slice into header + bullet slices when the
 * layout only has splittable units (entire-subsection continuation).
 */
export function decomposeFullItemSlice(
  slice: SectionRenderSlice,
  units: LayoutUnit[],
): SectionRenderSlice[] | null {
  if (slice.part !== 'full' && slice.part !== undefined) return null;
  if (slice.itemStart == null) return null;
  if (!SPLITTABLE_LIST_SECTIONS.has(slice.sectionId)) return null;

  const itemIndex = slice.itemStart;
  if (findListItemUnit(units, slice.sectionId, itemIndex, 'full')) {
    return null;
  }

  const headerUnit = findListItemUnit(units, slice.sectionId, itemIndex, 'header');
  const bulletUnits = listBulletUnitsForItem(units, slice.sectionId, itemIndex);
  if (!headerUnit && !bulletUnits.length) return null;

  const out: SectionRenderSlice[] = [];
  if (headerUnit) {
    out.push({
      ...headerUnit.slice,
      showHeading: slice.showHeading,
    });
  }
  for (const bulletUnit of bulletUnits) {
    out.push({
      ...bulletUnit.slice,
      showHeading: false,
    });
  }

  return out.length > 1 ? out : null;
}
