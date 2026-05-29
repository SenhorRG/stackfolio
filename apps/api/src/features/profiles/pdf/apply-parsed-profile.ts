import { SkillLevel } from '@prisma/client';
import type { ParsedProfileFromPdf } from '@stackfolio/shared';
import type { PrismaService } from '../../../prisma/prisma.service';
import { identityToPrismaJson } from '../copy-profile-data';

export async function applyParsedProfileToProfile(
  prisma: PrismaService,
  profileId: string,
  parsed: ParsedProfileFromPdf,
  skillIds: string[],
  options?: { suggestedProfileName?: string },
): Promise<void> {
  const personName = options?.suggestedProfileName?.trim();
  const identity = personName
    ? { ...parsed.identity, fullName: personName }
    : parsed.identity;

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      profileData: identityToPrismaJson(identity),
      ...(personName ? { name: personName.slice(0, 120) } : {}),
    },
  });

  if (!skillIds.length) return;

  const existing = await prisma.profileSkill.findMany({
    where: { profileId },
    select: { skillId: true },
  });
  const existingIds = new Set(existing.map((row) => row.skillId));
  const toAdd = skillIds.filter((id) => !existingIds.has(id));
  if (!toAdd.length) return;

  await prisma.profileSkill.createMany({
    data: toAdd.map((skillId) => ({
      profileId,
      skillId,
      level: SkillLevel.intermediate,
      highlight: false,
    })),
    skipDuplicates: true,
  });
}
