import { parseSkillResourceCategories } from '../skills/parse-skill-resource-categories';
import type { ProfileResumeSource } from './layout-types';

type RawProfileSkillRow = {
  level: string;
  years: number | null;
  highlight: boolean;
  displayCategory?: string | null;
  skill: {
    name: string;
    slug: string;
    category: string;
    categories?: string[];
    resources?: unknown;
  };
};

export function normalizeProfileResumeSource(input: {
  name: string;
  profileData?: unknown;
  identity?: ProfileResumeSource['identity'];
  skills: RawProfileSkillRow[];
}): ProfileResumeSource {
  return {
    name: input.name,
    profileData: input.profileData,
    identity: input.identity,
    skills: input.skills.map((row) => {
      const resourceCategories = parseSkillResourceCategories(row.skill.resources);
      const categories = row.skill.categories?.length
        ? row.skill.categories
        : resourceCategories;

      return {
        level: row.level,
        years: row.years,
        highlight: row.highlight,
        displayCategory: row.displayCategory ?? null,
        skill: {
          name: row.skill.name,
          slug: row.skill.slug,
          category: row.skill.category,
          categories,
          resources: row.skill.resources,
        },
      };
    }),
  };
}
