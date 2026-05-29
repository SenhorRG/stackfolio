import type { Profile, ProfileSkill, Skill } from '@prisma/client';
import { parseSkillResources } from '../skills/skill-resources';

type ProfileSkillWithSkill = ProfileSkill & { skill: Skill };

export type ProfileSkillResponse = {
  skillId: string;
  level: ProfileSkill['level'];
  years: number | null;
  highlight: boolean;
  displayCategory: string | null;
  skill: Pick<Skill, 'id' | 'name' | 'slug' | 'category' | 'description'> & {
    categories: string[];
  };
};

export function mapProfileSkills(
  skills: ProfileSkillWithSkill[],
): ProfileSkillResponse[] {
  return skills.map((row) => ({
    skillId: row.skillId,
    level: row.level,
    years: row.years,
    highlight: row.highlight,
    displayCategory: row.displayCategory,
    skill: {
      id: row.skill.id,
      name: row.skill.name,
      slug: row.skill.slug,
      category: row.skill.category,
      description: row.skill.description,
      categories: parseSkillResources(row.skill.resources).categories ?? [],
    },
  }));
}

export function mapProfileWithSkills<
  T extends Profile & { skills?: ProfileSkillWithSkill[] },
>(profile: T) {
  const { skills, ...rest } = profile;
  return {
    ...rest,
    skills: mapProfileSkills(skills ?? []),
  };
}
