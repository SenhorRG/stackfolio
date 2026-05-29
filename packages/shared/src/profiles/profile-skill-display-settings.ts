import type { ProfileIdentity } from '../entities/profile-identity';
import type { ResolvedSkillCategoryGroup } from '../resume/skills-by-category';

export type SkillInlineFormatOptions = {
  showLevel?: boolean;
  showYears?: boolean;
};

export function normalizeSkillCategoryKey(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveSkillInlineFormatOptions(
  identity: Pick<ProfileIdentity, 'skillShowLevel' | 'skillShowYears'>,
): Required<SkillInlineFormatOptions> {
  return {
    showLevel: identity.skillShowLevel !== false,
    showYears: identity.skillShowYears !== false,
  };
}

export function resolveSkillContentFormatOptions(
  content: Record<string, unknown>,
): Required<SkillInlineFormatOptions> {
  return {
    showLevel: content.skillShowLevel !== false,
    showYears: content.skillShowYears !== false,
  };
}

export function isSkillCategoryHidden(
  category: string,
  hiddenCategories: string[] | undefined,
): boolean {
  if (!hiddenCategories?.length) return false;
  const key = normalizeSkillCategoryKey(category);
  return hiddenCategories.some(
    (hidden) => normalizeSkillCategoryKey(hidden) === key,
  );
}

export function filterVisibleSkillCategoryGroups(
  groups: ResolvedSkillCategoryGroup[],
  hiddenCategories: string[] | undefined,
): ResolvedSkillCategoryGroup[] {
  if (!hiddenCategories?.length) return groups;
  return groups.filter(
    (group) =>
      !isSkillCategoryHidden(group.key, hiddenCategories) &&
      !isSkillCategoryHidden(group.label, hiddenCategories),
  );
}

export function toggleHiddenSkillCategory(
  hiddenCategories: string[] | undefined,
  category: string,
): string[] {
  const key = normalizeSkillCategoryKey(category);
  const current = hiddenCategories ?? [];
  if (current.some((hidden) => normalizeSkillCategoryKey(hidden) === key)) {
    return current.filter(
      (hidden) => normalizeSkillCategoryKey(hidden) !== key,
    );
  }
  return [...current, category];
}

export function filterHiddenSkillCategoriesToActive(
  hiddenCategories: string[] | undefined,
  activeCategories: string[],
): string[] {
  if (!hiddenCategories?.length) return [];
  const activeKeys = new Set(
    activeCategories.map((category) => normalizeSkillCategoryKey(category)),
  );
  return hiddenCategories.filter((hidden) =>
    activeKeys.has(normalizeSkillCategoryKey(hidden)),
  );
}
