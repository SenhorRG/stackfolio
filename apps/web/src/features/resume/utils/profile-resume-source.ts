import {
  parseProfileIdentity,
  type ProfileIdentity,
  type ProfileResumeSource,
} from '@stackfolio/shared';

type ProfileApiResponse = {
  name: string;
  profileData: unknown;
  skills: Array<{
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
  }>;
};

export function toProfileResumeSource(
  profile: ProfileApiResponse,
): ProfileResumeSource {
  const identity: ProfileIdentity | undefined = profile.profileData
    ? parseProfileIdentity(profile.profileData)
    : undefined;
  return {
    name: profile.name,
    profileData: profile.profileData,
    identity,
    skills: profile.skills.map((row) => ({
      level: row.level,
      years: row.years,
      highlight: row.highlight,
      displayCategory: row.displayCategory ?? null,
      skill: {
        name: row.skill.name,
        slug: row.skill.slug,
        category: row.skill.category,
        categories: row.skill.categories,
        resources: row.skill.resources,
      },
    })),
  };
}
