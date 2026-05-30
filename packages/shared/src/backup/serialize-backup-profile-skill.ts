import { resolveProfileSkillDisplayCategory } from '../profiles/resolve-profile-skill-display-category';
import { parseSkillResourceCategories } from '../skills/parse-skill-resource-categories';
import type { BackupProfileSkillRecord } from './backup-profile-skill-record';

export type BackupProfileSkillSource = {
  level: string;
  years: number | null;
  highlight: boolean;
  displayCategory: string | null;
  skill: {
    slug: string;
    name: string;
    category: string;
    resources?: unknown;
  };
};

function skillCatalogCategories(skill: BackupProfileSkillSource['skill']): string[] {
  const fromResources = parseSkillResourceCategories(skill.resources);
  if (fromResources.length) return [...new Set(fromResources)];
  const trimmed = skill.category.trim();
  return trimmed ? [trimmed] : [];
}

/**
 * Exports the effective resume category when DB stores null (UI default selection).
 */
export function serializeBackupProfileSkill(
  row: BackupProfileSkillSource,
): BackupProfileSkillRecord {
  const categories = skillCatalogCategories(row.skill);
  const explicitCategory = row.displayCategory?.trim() || null;
  const effectiveCategory = resolveProfileSkillDisplayCategory({
    highlight: row.highlight,
    displayCategory: row.displayCategory,
    skill: {
      name: row.skill.name,
      category: row.skill.category,
      categories: categories.length ? categories : undefined,
      resources: row.skill.resources,
    },
  });

  return {
    skillSlug: row.skill.slug,
    level: row.level,
    years: row.years,
    highlight: row.highlight,
    displayCategory: explicitCategory ?? effectiveCategory,
  };
}
