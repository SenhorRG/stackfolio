import type { Profile, ProfileSkill, Skill } from '@prisma/client';
import {
  normalizeProfileIdentityForBackup,
  serializeBackupProfileSkill,
  type BackupProfileRecord,
} from '@stackfolio/shared';

type ProfileWithSkills = Profile & {
  skills: Array<ProfileSkill & { skill: Skill }>;
};

export function serializeProfileForBackup(
  profile: ProfileWithSkills,
): BackupProfileRecord {
  return {
    exportId: profile.id,
    name: profile.name,
    basedOnExportId: profile.basedOnProfileId,
    profileData: normalizeProfileIdentityForBackup(profile.profileData),
    skills: profile.skills.map((row) =>
      serializeBackupProfileSkill({
        level: row.level,
        years: row.years,
        highlight: row.highlight,
        displayCategory: row.displayCategory,
        skill: {
          slug: row.skill.slug,
          name: row.skill.name,
          category: row.skill.category,
          resources: row.skill.resources,
        },
      }),
    ),
  };
}
