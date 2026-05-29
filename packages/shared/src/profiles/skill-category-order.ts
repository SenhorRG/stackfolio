import {
  CORE_STACK_CATEGORY,
  isCoreStackCategory,
  profileHasCoreStackSkills,
} from './core-stack-category';
import { resolveProfileSkillDisplayCategory } from './resolve-profile-skill-display-category';
import type { ProfileSkillCategorySource } from './resolve-profile-skill-display-category';

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function collectProfileSkillDisplayCategories(
  skills: ProfileSkillCategorySource[],
): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const skill of skills) {
    const category = resolveProfileSkillDisplayCategory(skill);
    const key = normalizeKey(category);
    if (seen.has(key)) continue;
    seen.add(key);
    categories.push(category);
  }

  if (profileHasCoreStackSkills(skills)) {
    const coreStackKey = normalizeKey(CORE_STACK_CATEGORY);
    if (!seen.has(coreStackKey)) {
      categories.push(CORE_STACK_CATEGORY);
    }
  }

  return categories.sort((a, b) => a.localeCompare(b));
}

/** Keeps saved order, drops removed categories, appends new ones alphabetically. */
export function mergeSkillCategoryOrder(
  savedOrder: string[] | undefined,
  activeCategories: string[],
): string[] {
  const activeByKey = new Map(
    activeCategories.map((category) => [normalizeKey(category), category]),
  );
  const kept: string[] = [];
  const keptKeys = new Set<string>();

  for (const category of savedOrder ?? []) {
    const resolved = activeByKey.get(normalizeKey(category));
    if (!resolved) continue;
    kept.push(resolved);
    keptKeys.add(normalizeKey(resolved));
  }

  const added = activeCategories.filter(
    (category) => !keptKeys.has(normalizeKey(category)),
  );
  const addedCoreStack = added.filter(isCoreStackCategory);
  const addedOther = added
    .filter((category) => !isCoreStackCategory(category))
    .sort((a, b) => a.localeCompare(b));

  const merged = [...kept, ...addedOther];
  if (!addedCoreStack.length) return merged;

  return [
    CORE_STACK_CATEGORY,
    ...merged.filter((category) => !isCoreStackCategory(category)),
  ];
}

export function sortLabelsByCategoryOrder(
  labels: string[],
  categoryOrder?: string[],
): string[] {
  if (!categoryOrder?.length) {
    return [...labels].sort((a, b) => a.localeCompare(b));
  }

  const rank = new Map<string, number>();
  categoryOrder.forEach((label, index) => {
    rank.set(normalizeKey(label), index);
  });

  return [...labels].sort((a, b) => {
    const aRank = rank.get(normalizeKey(a)) ?? Number.MAX_SAFE_INTEGER;
    const bRank = rank.get(normalizeKey(b)) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}
