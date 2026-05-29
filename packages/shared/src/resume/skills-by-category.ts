import type { SkillInlineFormatOptions } from '../profiles/profile-skill-display-settings';
import { CORE_STACK_CATEGORY } from '../profiles/core-stack-category';
import { capitalizeFirstLetter } from '../strings/capitalize-first-letter';
import { parseSkillResourceCategories } from '../skills/parse-skill-resource-categories';
import type {
  JsonLayoutShape,
  ProfileResumeSource,
  ResumeSectionLayoutConfig,
} from './layout-types';

export type SkillItemInput = {
  skillSlug?: string;
  name: string;
  level?: string;
  years?: number | null;
  category?: string;
  categories?: string[];
  resources?: unknown;
  /** When true, category is free-text (resume editor custom category). */
  categoryIsCustom?: boolean;
  /** When true, skill also appears under Core Stack on the resume. */
  highlight?: boolean;
};

/** Skills render as comma-separated lines under each category. */
export type SkillCategoryDisplayMode = 'comma';

export type ResolvedSkillCategoryGroup = {
  key: string;
  label: string;
  display: SkillCategoryDisplayMode;
  skills: Array<{
    name: string;
    level?: string;
    years?: number | null;
    skillSlug?: string;
  }>;
};

export const SKILL_CATEGORY_CUSTOM = '__custom__';

type SkillCatalogInput = {
  category?: string;
  categories?: string[];
  resources?: unknown;
};

export function skillCatalogCategories(item: SkillItemInput): string[] {
  return resolveCatalogCategories(item);
}

function resolveCatalogCategories(item: SkillCatalogInput): string[] {
  const fromList = item.categories?.filter(Boolean) ?? [];
  if (fromList.length) return [...new Set(fromList)];
  const fromResources = parseSkillResourceCategories(item.resources);
  if (fromResources.length) return [...new Set(fromResources)];
  if (item.category?.trim()) return [item.category.trim()];
  return [];
}

export function resolveSkillDisplayCategory(item: SkillItemInput): string {
  const chosen = item.category?.trim();
  const catalog = skillCatalogCategories(item);

  if (chosen) {
    const match = catalog.find(
      (category) => category.toLowerCase() === chosen.toLowerCase(),
    );
    if (match) return formatSkillCategoryLabel(match);
    return formatSkillCategoryLabel(chosen);
  }

  if (catalog.length) return formatSkillCategoryLabel(catalog[0]!);
  return 'Other';
}

export function formatSkillCategoryLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;
  return capitalizeFirstLetter(trimmed);
}

function profileSkillCatalogCategories(
  skill: ProfileResumeSource['skills'][number]['skill'],
): string[] {
  return resolveCatalogCategories({
    category: skill.category,
    categories: skill.categories,
    resources: skill.resources,
  });
}

export function profileSkillItems(profile: ProfileResumeSource): SkillItemInput[] {
  return profile.skills.map((pt) => {
    const categories = profileSkillCatalogCategories(pt.skill);

    return {
      skillSlug: pt.skill.slug,
      name: pt.skill.name,
      level: pt.level,
      years: pt.years,
      highlight: pt.highlight,
      category: pt.displayCategory?.trim() || undefined,
      categories: categories.length ? categories : undefined,
      resources: pt.skill.resources,
    };
  });
}

export function enrichSkillItemsFromProfile(
  items: SkillItemInput[],
  profile: ProfileResumeSource,
): SkillItemInput[] {
  const profileBySlug = new Map(
    profile.skills
      .filter((row) => row.skill.slug)
      .map((row) => [row.skill.slug, row] as const),
  );

  return items.map((item) => {
    if (skillCatalogCategories(item).length) return item;

    const profileRow = item.skillSlug
      ? profileBySlug.get(item.skillSlug)
      : undefined;
    if (!profileRow) return item;

    const catalog = profileSkillCatalogCategories(profileRow.skill);
    const displayCategory = profileRow.displayCategory?.trim();

    if (!catalog.length && !displayCategory) return item;

    return {
      ...item,
      category: item.category?.trim() || displayCategory || catalog[0],
      categories: catalog.length ? catalog : item.categories,
      resources: item.resources ?? profileRow.skill.resources,
      highlight: item.highlight ?? profileRow.highlight,
    };
  });
}

export function buildSkillInlineParenthetical(
  skill: { level?: string; years?: number | null },
  options?: SkillInlineFormatOptions,
): string {
  const showLevel = options?.showLevel !== false;
  const showYears = options?.showYears !== false;
  const details: string[] = [];

  if (showLevel && skill.level) {
    details.push(skill.level);
  }
  if (showYears && skill.years != null && skill.years > 0) {
    details.push(`${skill.years}y`);
  }

  return details.length ? ` (${details.join(', ')})` : '';
}

function formatSkillInline(
  skill: {
    name: string;
    level?: string;
    years?: number | null;
    skillSlug?: string;
  },
  options?: SkillInlineFormatOptions,
): string {
  const name = skill.name?.trim() || skill.skillSlug?.trim() || '';
  return `${name}${buildSkillInlineParenthetical(skill, options)}`;
}

export { formatSkillInline };

export function formatSkillCategoryCommaLine(
  group: ResolvedSkillCategoryGroup,
  options?: SkillInlineFormatOptions,
): string {
  return group.skills.map((skill) => formatSkillInline(skill, options)).join(', ');
}

export function collectCatalogCategoryKeys(items: SkillItemInput[]): string[] {
  const keys = new Set<string>();
  for (const item of items) {
    for (const cat of skillCatalogCategories(item)) {
      keys.add(cat);
    }
    const display = resolveSkillDisplayCategory(item);
    if (display) keys.add(display);
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

/** Maps legacy `tags` / `list` values to comma list display. */
export function normalizeSkillsDisplay(value: unknown): SkillCategoryDisplayMode {
  void value;
  return 'comma';
}

export function normalizeJsonLayoutSkillsDisplay(
  layout: JsonLayoutShape,
): JsonLayoutShape {
  const skills = layout.sections?.skills;
  if (!skills) return layout;
  const display = normalizeSkillsDisplay(skills.display);
  if (skills.display === display) return layout;
  return {
    ...layout,
    sections: {
      ...layout.sections,
      skills: { ...skills, display },
    },
  };
}

function resolveGlobalDisplay(
  config: ResumeSectionLayoutConfig,
): SkillCategoryDisplayMode {
  return normalizeSkillsDisplay(config.display);
}

function buildResolvedSkillEntry(item: SkillItemInput) {
  return {
    name: item.name?.trim() || item.skillSlug?.trim() || '',
    level: item.level,
    years: item.years,
    skillSlug: item.skillSlug,
  };
}

function appendSkillToCategoryGroup(
  byKey: Map<string, ResolvedSkillCategoryGroup>,
  key: string,
  skill: ReturnType<typeof buildResolvedSkillEntry>,
  display: SkillCategoryDisplayMode,
) {
  const existing = byKey.get(key);
  if (existing) {
    existing.skills.push(skill);
    return;
  }

  byKey.set(key, {
    key,
    label: formatSkillCategoryLabel(key),
    display,
    skills: [skill],
  });
}

export function buildSkillsCategoryGroups(
  items: SkillItemInput[],
  config: ResumeSectionLayoutConfig,
  categoryOrder?: string[],
): ResolvedSkillCategoryGroup[] {
  const globalDisplay = resolveGlobalDisplay(config);
  const byKey = new Map<string, ResolvedSkillCategoryGroup>();

  for (const item of items) {
    const key = resolveSkillDisplayCategory(item);
    const skill = buildResolvedSkillEntry(item);
    appendSkillToCategoryGroup(byKey, key, skill, globalDisplay);

    if (item.highlight) {
      appendSkillToCategoryGroup(
        byKey,
        CORE_STACK_CATEGORY,
        skill,
        globalDisplay,
      );
    }
  }

  const groups = [...byKey.values()];
  if (!categoryOrder?.length) {
    return groups.sort((a, b) => a.label.localeCompare(b.label));
  }

  const rank = new Map<string, number>();
  categoryOrder.forEach((label, index) => {
    rank.set(label.trim().toLowerCase(), index);
  });

  return groups.sort((a, b) => {
    const aRank =
      rank.get(a.key.toLowerCase()) ??
      rank.get(a.label.toLowerCase()) ??
      Number.MAX_SAFE_INTEGER;
    const bRank =
      rank.get(b.key.toLowerCase()) ??
      rank.get(b.label.toLowerCase()) ??
      Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.label.localeCompare(b.label);
  });
}

/** @deprecated Per-category overrides removed; kept for type compatibility. */
export type SkillCategoryOverride = {
  key: string;
  label?: string;
  excluded?: boolean;
  display?: SkillCategoryDisplayMode;
};

export function parseSkillCategoryOverrides(
  _config: ResumeSectionLayoutConfig,
): SkillCategoryOverride[] {
  return [];
}
