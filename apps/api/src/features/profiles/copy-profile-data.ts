import { Prisma, SkillLevel } from '@prisma/client';
import {
  emptyProfileIdentity,
  parseProfileIdentity,
  ProfileIdentity,
} from '@stackfolio/shared';

export function identityToPrismaJson(
  identity: ProfileIdentity,
): Prisma.InputJsonValue {
  return identity as Prisma.InputJsonValue;
}

export async function copySkillsFromProfile(
  prisma: {
    profileSkill: {
      findMany: (args: {
        where: { profileId: string };
      }) => Promise<
        Array<{
          skillId: string;
          level: SkillLevel;
          years: number | null;
          highlight: boolean;
          displayCategory: string | null;
        }>
      >;
      createMany: (args: {
        data: Array<{
          profileId: string;
          skillId: string;
          level: SkillLevel;
          years: number | null;
          highlight: boolean;
          displayCategory: string | null;
        }>;
        skipDuplicates?: boolean;
      }) => Promise<unknown>;
    };
  },
  sourceProfileId: string,
  targetProfileId: string,
): Promise<void> {
  const stacks = await prisma.profileSkill.findMany({
    where: { profileId: sourceProfileId },
  });
  if (!stacks.length) return;
  await prisma.profileSkill.createMany({
    data: stacks.map((s) => ({
      profileId: targetProfileId,
      skillId: s.skillId,
      level: s.level,
      years: s.years,
      highlight: s.highlight,
      displayCategory: s.displayCategory,
    })),
    skipDuplicates: true,
  });
}

export function copyProfileIdentityFrom(source: unknown): ProfileIdentity {
  return parseProfileIdentity(source ?? emptyProfileIdentity());
}

/** @deprecated Use copySkillsFromProfile */
export const copyTechnologiesFromProfile = copySkillsFromProfile;
