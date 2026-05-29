import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { SectionRenderSlice } from './section-layout-units';

const LIST_SECTIONS_WITH_ITEMS = new Set<ResumeSectionIdValue>([
  'experience',
  'education',
  'projects',
  'certifications',
  'languages',
  'links',
]);

/** Merge consecutive comma-line skill slices (matches cv-preview.renderer). */
export function coalesceCommaSkillLineSlices(
  slices: SectionRenderSlice[],
): SectionRenderSlice[] {
  const out: SectionRenderSlice[] = [];

  for (const slice of slices) {
    if (!slice.commaLineBatch) {
      out.push(slice);
      continue;
    }

    const prev = out[out.length - 1];
    const sameCategory =
      prev?.commaLineBatch &&
      prev.sectionId === 'skills' &&
      prev.categoryStart === slice.categoryStart &&
      prev.categoryEnd === slice.categoryEnd;

    if (
      sameCategory &&
      prev &&
      prev.skillBatchEnd === slice.skillBatchStart
    ) {
      const prevStart = prev.skillBatchStart;
      const prevEnd = prev.skillBatchEnd;
      const sliceStart = slice.skillBatchStart;
      const sliceEnd = slice.skillBatchEnd;
      if (
        prevStart == null ||
        prevEnd == null ||
        sliceStart == null ||
        sliceEnd == null
      ) {
        out.push(slice);
        continue;
      }
      const parts =
        prev.commaLineParts ??
        [
          {
            skillBatchStart: prevStart,
            skillBatchEnd: prevEnd,
          },
        ];
      out[out.length - 1] = {
        ...prev,
        skillBatchEnd: sliceEnd,
        commaLineParts: [
          ...parts,
          {
            skillBatchStart: sliceStart,
            skillBatchEnd: sliceEnd,
          },
        ],
      };
      continue;
    }

    out.push(slice);
  }

  return out;
}

/** Merge consecutive full-item list slices for one section (one `<ul>` in preview). */
export function coalesceFullListItemSlices(
  slices: SectionRenderSlice[],
): SectionRenderSlice[] {
  const out: SectionRenderSlice[] = [];

  for (const slice of slices) {
    const isMergeableFull =
      LIST_SECTIONS_WITH_ITEMS.has(slice.sectionId) &&
      (slice.part === 'full' || slice.part === undefined) &&
      slice.itemStart != null &&
      slice.itemEnd != null;

    if (!isMergeableFull) {
      out.push(slice);
      continue;
    }

    const prev = out[out.length - 1];
    const prevMergeable =
      prev &&
      LIST_SECTIONS_WITH_ITEMS.has(prev.sectionId) &&
      (prev.part === 'full' || prev.part === undefined) &&
      prev.sectionId === slice.sectionId &&
      prev.itemEnd === slice.itemStart &&
      !slice.showHeading;

    if (prevMergeable && prev.itemEnd != null && slice.itemEnd != null) {
      out[out.length - 1] = {
        ...prev,
        itemEnd: slice.itemEnd,
      };
      continue;
    }

    out.push(slice);
  }

  return out;
}

/** Merge consecutive skill category slices into one section block (matches preview). */
export function coalesceSkillCategorySlices(
  slices: SectionRenderSlice[],
): SectionRenderSlice[] {
  const out: SectionRenderSlice[] = [];

  for (const slice of slices) {
    if (slice.sectionId !== 'skills') {
      out.push(slice);
      continue;
    }

    const prev = out[out.length - 1];
    const adjacentCategory =
      prev?.sectionId === 'skills' &&
      prev.categoryStart != null &&
      prev.categoryEnd != null &&
      slice.categoryStart != null &&
      slice.categoryEnd != null &&
      prev.categoryEnd === slice.categoryStart &&
      !slice.showHeading;

    if (adjacentCategory) {
      out[out.length - 1] = {
        ...prev,
        categoryEnd: slice.categoryEnd,
        skillBatchStart: undefined,
        skillBatchEnd: undefined,
        commaLineBatch: undefined,
        commaLineParts: undefined,
      };
      continue;
    }

    out.push(slice);
  }

  return out;
}

/** Align packing height estimates with preview DOM batching. */
export function coalesceSlicesForLayout(
  slices: SectionRenderSlice[],
): SectionRenderSlice[] {
  return coalesceFullListItemSlices(
    coalesceSkillCategorySlices(coalesceCommaSkillLineSlices(slices)),
  );
}
