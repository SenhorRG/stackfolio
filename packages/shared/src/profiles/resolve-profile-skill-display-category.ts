import { resolveSkillDisplayCategory } from '../resume/skills-by-category';

export type ProfileSkillCategorySource = {
  highlight?: boolean;
  displayCategory: string | null;
  skill: {
    name: string;
    category: string;
    categories?: string[];
    resources?: unknown;
  };
};

export function resolveProfileSkillDisplayCategory(
  entry: ProfileSkillCategorySource,
): string {
  return resolveSkillDisplayCategory({
    name: entry.skill.name,
    category: entry.displayCategory?.trim() || undefined,
    categories: entry.skill.categories,
    resources: entry.skill.resources,
  });
}
