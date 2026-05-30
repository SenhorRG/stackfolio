import type { ResumeSectionIdValue } from '../enums/resume-section';
import {
  buildSkillsCategoryGroups,
  type ResolvedSkillCategoryGroup,
  type SkillItemInput,
} from './skills-by-category';
import { resolveSkillContentFormatOptions } from '../profiles/profile-skill-display-settings';
import type { SkillInlineFormatOptions } from '../profiles/profile-skill-display-settings';
import { normalizeItemBullets } from './normalize-item-bullets';
import {
  nestedBulletItemGapPx,
  nestedListTopMarginPx,
  resolveBulletVisualLineHeightPx,
} from './bullet-line-height';
import { estimateWrappedTextLineCount } from './estimate-wrapped-text-line-count';
import { splitCommaCategoryIntoLineBatches } from './split-comma-category-line-batches';
import {
  resolvePackingMetrics,
  type PackingMetrics,
} from './typography-packing-metrics';

export {
  BASE_LINE_PX,
  BULLET_LINE_HEIGHT_PX,
  LIST_ITEM_HEADER_HEIGHT_PX,
  SECTION_GAP_PX,
  SECTION_TITLE_HEIGHT_PX,
} from './typography-packing-metrics';

export type ListSlicePart = 'full' | 'header' | 'bullet';

export type SectionRenderSlice = {
  sectionId: ResumeSectionIdValue;
  showHeading: boolean;
  itemStart?: number;
  itemEnd?: number;
  categoryStart?: number;
  categoryEnd?: number;
  /** Inclusive start index within the category's skills array (line batch). */
  skillBatchStart?: number;
  /** Exclusive end index within the category's skills array (line batch). */
  skillBatchEnd?: number;
  part?: ListSlicePart;
  bulletIndex?: number;
  /** One visual wrapped line in comma/list skills mode (for renderer coalescing). */
  commaLineBatch?: boolean;
  /** Multiple comma lines merged for one `<li>` on the same preview page. */
  commaLineParts?: Array<{
    skillBatchStart: number;
    skillBatchEnd: number;
  }>;
};

export type LayoutUnit = {
  sectionId: ResumeSectionIdValue;
  contentHeightPx: number;
  slice: Omit<SectionRenderSlice, 'showHeading'>;
};

const SPLITTABLE_LIST_SECTIONS = new Set<ResumeSectionIdValue>([
  'experience',
  'education',
]);

export function estimateSkillCategoryHeightPx(
  group: ResolvedSkillCategoryGroup | Record<string, unknown>,
  metrics: PackingMetrics = resolvePackingMetrics(),
  formatOptions?: SkillInlineFormatOptions,
): number {
  const row = group as ResolvedSkillCategoryGroup;
  const skills = row.skills ?? [];
  if (!skills.length) return 0;
  const lineBatches = splitCommaCategoryIntoLineBatches(
    row,
    metrics,
    formatOptions,
  );
  const lines = Math.max(1, lineBatches.length);
  // Category labels render inline on the first visual line (see renderSkillCategory).
  return lines * metrics.baseLinePx;
}

function buildCommaSkillLayoutUnits(
  group: ResolvedSkillCategoryGroup,
  categoryIndex: number,
  metrics: PackingMetrics,
  formatOptions?: SkillInlineFormatOptions,
): LayoutUnit[] {
  const baseSlice = {
    sectionId: 'skills' as const,
    categoryStart: categoryIndex,
    categoryEnd: categoryIndex + 1,
  };
  const lineBatches = splitCommaCategoryIntoLineBatches(
    group,
    metrics,
    formatOptions,
  );

  if (lineBatches.length <= 1) {
    return [
      {
        sectionId: 'skills',
        contentHeightPx: estimateSkillCategoryHeightPx(
          group,
          metrics,
          formatOptions,
        ),
        slice: baseSlice,
      },
    ];
  }

  return lineBatches.map((batch) => ({
    sectionId: 'skills',
    contentHeightPx: metrics.baseLinePx,
    slice: {
      ...baseSlice,
      skillBatchStart: batch.skillStart,
      skillBatchEnd: batch.skillEnd,
      commaLineBatch: true,
    },
  }));
}

export function estimateListItemHeightPx(
  item: Record<string, unknown>,
  metrics: PackingMetrics = resolvePackingMetrics(),
  sectionId: ResumeSectionIdValue = 'experience',
): number {
  const bullets = normalizeItemBullets(item);
  if (!bullets.length) {
    return metrics.listItemHeaderHeightPx;
  }

  const linePx = resolveBulletVisualLineHeightPx(
    sectionId,
    'full-item',
    metrics,
  );
  const wrapColumn =
    sectionId === 'education' || sectionId === 'projects'
      ? 'full-width'
      : 'nested-list';
  const bulletGapPx = nestedBulletItemGapPx(metrics);
  let bodyHeight = nestedListTopMarginPx(metrics);

  for (let index = 0; index < bullets.length; index++) {
    if (index > 0) {
      bodyHeight += bulletGapPx;
    }
    const visualLines = estimateWrappedTextLineCount(
      bullets[index]!,
      metrics,
      wrapColumn,
    );
    bodyHeight += visualLines * linePx;
  }

  return metrics.listItemHeaderHeightPx + bodyHeight;
}

export function estimateSummaryHeightPx(
  content: Record<string, unknown>,
  metrics: PackingMetrics = resolvePackingMetrics(),
): number {
  const text = String(content.text ?? '');
  const lines = Math.max(1, Math.ceil(text.length / 80));
  return lines * metrics.baseLinePx;
}

function buildSplittableListUnits(
  sectionId: ResumeSectionIdValue,
  items: Array<Record<string, unknown>>,
  metrics: PackingMetrics,
): LayoutUnit[] {
  const units: LayoutUnit[] = [];
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const item = items[itemIndex]!;
    const baseSlice = {
      sectionId,
      itemStart: itemIndex,
      itemEnd: itemIndex + 1,
    };
    const bullets = normalizeItemBullets(item);

    if (bullets.length <= 1) {
      units.push({
        sectionId,
        contentHeightPx: estimateListItemHeightPx(item, metrics, sectionId),
        slice: { ...baseSlice, part: 'full' },
      });
      continue;
    }

    units.push({
      sectionId,
      contentHeightPx: metrics.listItemHeaderHeightPx,
      slice: { ...baseSlice, part: 'header' },
    });
    const bulletLinePx = resolveBulletVisualLineHeightPx(
      sectionId,
      'split-bullet',
      metrics,
    );
    for (let bi = 0; bi < bullets.length; bi++) {
      const visualLines = estimateWrappedTextLineCount(bullets[bi]!, metrics);
      units.push({
        sectionId,
        contentHeightPx: visualLines * bulletLinePx,
        slice: { ...baseSlice, part: 'bullet', bulletIndex: bi },
      });
    }
  }
  return units;
}

function buildFlatCommaSkillUnits(
  items: ResolvedSkillCategoryGroup['skills'],
  metrics: PackingMetrics,
  formatOptions?: SkillInlineFormatOptions,
): LayoutUnit[] {
  const pseudo: ResolvedSkillCategoryGroup = {
    key: 'all',
    label: '',
    display: 'comma',
    skills: items,
  };
  const lineBatches = splitCommaCategoryIntoLineBatches(
    pseudo,
    metrics,
    formatOptions,
  );

  if (lineBatches.length <= 1) {
    return [
      {
        sectionId: 'skills',
        contentHeightPx: estimateSkillCategoryHeightPx(
          pseudo,
          metrics,
          formatOptions,
        ),
        slice: { sectionId: 'skills' },
      },
    ];
  }

  return lineBatches.map((batch) => ({
    sectionId: 'skills',
    contentHeightPx: metrics.baseLinePx,
    slice: {
      sectionId: 'skills',
      skillBatchStart: batch.skillStart,
      skillBatchEnd: batch.skillEnd,
      commaLineBatch: true,
    },
  }));
}

export function buildLayoutUnits(
  sectionId: ResumeSectionIdValue,
  content: Record<string, unknown>,
  metrics: PackingMetrics = resolvePackingMetrics(),
): LayoutUnit[] {
  switch (sectionId) {
    case 'summary': {
      return [
        {
          sectionId,
          contentHeightPx: estimateSummaryHeightPx(content, metrics),
          slice: { sectionId },
        },
      ];
    }
    case 'skills': {
      const formatOptions = resolveSkillContentFormatOptions(content);
      const items = (content.items as SkillItemInput[]) ?? [];
      let categories = content.categories as
        | ResolvedSkillCategoryGroup[]
        | undefined;

      if ((!Array.isArray(categories) || !categories.length) && items.length) {
        categories = buildSkillsCategoryGroups(items, {
          display: 'comma',
        });
      }

      if (Array.isArray(categories) && categories.length) {
        return categories.flatMap((group, index) =>
          buildCommaSkillLayoutUnits(
            { ...group, display: 'comma' },
            index,
            metrics,
            formatOptions,
          ),
        );
      }
      if (!items.length) {
        return [
          {
            sectionId,
            contentHeightPx: metrics.sectionGapPx,
            slice: { sectionId },
          },
        ];
      }
      return buildFlatCommaSkillUnits(items, metrics, formatOptions);
    }
    default: {
      const items = (content.items as Array<Record<string, unknown>>) ?? [];
      if (!items.length) {
        return [];
      }
      if (SPLITTABLE_LIST_SECTIONS.has(sectionId)) {
        return buildSplittableListUnits(sectionId, items, metrics);
      }
      return items.map((item, index) => ({
        sectionId,
        contentHeightPx: estimateListItemHeightPx(item, metrics, sectionId),
        slice: {
          sectionId,
          itemStart: index,
          itemEnd: index + 1,
          part: 'full',
        },
      }));
    }
  }
}
