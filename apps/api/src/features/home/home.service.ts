import { Injectable } from '@nestjs/common';
import { RelationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_RECENT_PROFILES = 5;
const MAX_RECENT_RESUMES = 6;

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userId: string) {
    const [main, profiles, settings] = await Promise.all([
      this.prisma.profile.findFirst({
        where: { userId, isMain: true },
        include: {
          skills: { include: { skill: true } },
          _count: { select: { resumeProjects: true } },
        },
      }),
      this.prisma.profile.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { resumeProjects: true } } },
      }),
      this.prisma.userSettings.findUnique({ where: { userId } }),
    ]);

    const recentProfileIds = Array.isArray(settings?.recentProfileIds)
      ? (settings.recentProfileIds as string[]).slice(0, MAX_RECENT_PROFILES)
      : [];
    const recentResumeIds = Array.isArray(settings?.recentResumeIds)
      ? (settings.recentResumeIds as string[]).slice(0, MAX_RECENT_RESUMES)
      : [];

    const recentProfileRows = recentProfileIds.length
      ? await this.prisma.profile.findMany({
          where: { id: { in: recentProfileIds }, userId },
          include: { _count: { select: { resumeProjects: true } } },
        })
      : [];

    const orderedRecentProfiles = recentProfileIds
      .map((id) => recentProfileRows.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, MAX_RECENT_PROFILES);

    const fallbackRecentProfiles = profiles
      .filter((p) => !p.isMain)
      .slice(0, MAX_RECENT_PROFILES);

    const recentResumeRows = recentResumeIds.length
      ? await this.prisma.resumeProject.findMany({
          where: { id: { in: recentResumeIds }, profile: { userId } },
          include: {
            profile: { select: { id: true, name: true, isMain: true } },
          },
        })
      : [];

    const orderedRecentResumes = recentResumeIds
      .map((id) => recentResumeRows.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .slice(0, MAX_RECENT_RESUMES);

    return {
      mainProfile: main,
      recentProfiles: orderedRecentProfiles.length
        ? orderedRecentProfiles
        : fallbackRecentProfiles,
      recentResumes: orderedRecentResumes,
    };
  }

  async learningSuggestions(userId: string, limit = 10) {
    const main = await this.prisma.profile.findFirst({
      where: { userId, isMain: true },
      include: { skills: { include: { skill: true } } },
    });
    if (!main?.skills.length) return [];

    const knownIds = main.skills.map((t) => t.skillId);
    const skillById = new Map(main.skills.map((ps) => [ps.skillId, ps.skill]));

    const relations = await this.prisma.skillRelation.findMany({
      where: {
        sourceId: { in: knownIds },
        relationType: {
          in: [
            RelationType.prerequisite,
            RelationType.advanced,
            RelationType.ecosystem,
            RelationType.related,
          ],
        },
        targetId: { notIn: knownIds },
      },
      include: { target: true, source: true },
      take: limit * 2,
    });

    const seen = new Set<string>();
    const suggestions = [];
    for (const rel of relations) {
      if (seen.has(rel.targetId)) continue;
      seen.add(rel.targetId);
      const sourceSkill =
        skillById.get(rel.sourceId) ?? rel.source;
      suggestions.push({
        skill: rel.target,
        relationType: rel.relationType,
        sourceSkillName: sourceSkill.name,
        reason: `Related to your skill: "${sourceSkill.name}"`,
      });
      if (suggestions.length >= limit) break;
    }
    return suggestions;
  }
}
