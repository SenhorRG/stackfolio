import { Prisma } from '@prisma/client';

type SkillDb = Prisma.TransactionClient;

export async function migrateProfileSkillsOnMerge(
  prisma: SkillDb,
  preferredId: string,
  secondaryId: string,
): Promise<{ reassigned: number; dropped: number }> {
  const secondaryLinks = await prisma.profileSkill.findMany({
    where: { skillId: secondaryId },
  });
  if (secondaryLinks.length === 0) {
    return { reassigned: 0, dropped: 0 };
  }

  const profileIds = secondaryLinks.map((link) => link.profileId);
  const preferredLinks = await prisma.profileSkill.findMany({
    where: {
      skillId: preferredId,
      profileId: { in: profileIds },
    },
    select: { profileId: true },
  });
  const conflictingProfiles = new Set(
    preferredLinks.map((link) => link.profileId),
  );

  let reassigned = 0;
  let dropped = 0;

  for (const link of secondaryLinks) {
    if (conflictingProfiles.has(link.profileId)) {
      await prisma.profileSkill.delete({
        where: {
          profileId_skillId: {
            profileId: link.profileId,
            skillId: secondaryId,
          },
        },
      });
      dropped += 1;
      continue;
    }

    await prisma.profileSkill.update({
      where: {
        profileId_skillId: {
          profileId: link.profileId,
          skillId: secondaryId,
        },
      },
      data: { skillId: preferredId },
    });
    reassigned += 1;
  }

  return { reassigned, dropped };
}

export async function migrateSkillRelationsOnMerge(
  prisma: SkillDb,
  preferredId: string,
  secondaryId: string,
): Promise<void> {
  const asSource = await prisma.skillRelation.findMany({
    where: { sourceId: secondaryId },
  });
  for (const relation of asSource) {
    const targetId =
      relation.targetId === secondaryId ? preferredId : relation.targetId;
    const existing = await prisma.skillRelation.findUnique({
      where: {
        sourceId_targetId_relationType: {
          sourceId: preferredId,
          targetId,
          relationType: relation.relationType,
        },
      },
    });
    if (existing) {
      await prisma.skillRelation.delete({ where: { id: relation.id } });
      continue;
    }
    await prisma.skillRelation.update({
      where: { id: relation.id },
      data: { sourceId: preferredId },
    });
  }

  const asTarget = await prisma.skillRelation.findMany({
    where: { targetId: secondaryId },
  });
  for (const relation of asTarget) {
    const sourceId =
      relation.sourceId === secondaryId ? preferredId : relation.sourceId;
    const existing = await prisma.skillRelation.findUnique({
      where: {
        sourceId_targetId_relationType: {
          sourceId,
          targetId: preferredId,
          relationType: relation.relationType,
        },
      },
    });
    if (existing) {
      await prisma.skillRelation.delete({ where: { id: relation.id } });
      continue;
    }
    await prisma.skillRelation.update({
      where: { id: relation.id },
      data: { targetId: preferredId },
    });
  }
}

export function toSkillMergeSnapshot(row: {
  name: string;
  slug: string;
  category: string;
  description: string | null;
  urls: unknown;
  resources: unknown;
  categories: string[];
}) {
  const urls =
    row.urls && typeof row.urls === 'object' && !Array.isArray(row.urls)
      ? (row.urls as Record<string, string>)
      : null;
  const resources =
    row.resources && typeof row.resources === 'object' && !Array.isArray(row.resources)
      ? (row.resources as Record<string, unknown>)
      : null;
  return {
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    urls,
    resources,
    categories: row.categories,
  };
}
