import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SkillLevel } from '@prisma/client';
import {
  backupExportRequestSchema,
  parseProfileIdentity,
  parseStackfolioBackup,
  STACKFOLIO_BACKUP_VERSION,
  validateProfileIdentity,
  type BackupExportRequest,
  type StackfolioBackup,
} from '@stackfolio/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { identityToPrismaJson } from '../copy-profile-data';
import { resolveUniqueImportedName } from './resolve-unique-imported-name';
import { serializeProfileForBackup } from './serialize-profile-for-backup';
import { serializeResumeForBackup } from './serialize-resume-for-backup';

const profileExportInclude = {
  skills: { include: { skill: true } },
} satisfies Prisma.ProfileInclude;

export type BackupImportResult = {
  profilesCreated: number;
  resumeProjectsCreated: number;
  warnings: string[];
};

@Injectable()
export class ProfileBackupService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProfilesOwned(userId: string, profileIds: string[]) {
    if (!profileIds.length) {
      throw new BadRequestException('Select at least one profile');
    }
    const rows = await this.prisma.profile.findMany({
      where: { id: { in: profileIds }, userId },
      select: { id: true },
    });
    if (rows.length !== profileIds.length) {
      throw new ForbiddenException('One or more profiles are not accessible');
    }
  }

  private async assertResumesOwned(userId: string, resumeIds: string[]) {
    if (!resumeIds.length) {
      throw new BadRequestException('Select at least one resume project');
    }
    const rows = await this.prisma.resumeProject.findMany({
      where: { id: { in: resumeIds } },
      include: { profile: { select: { userId: true } } },
    });
    if (rows.length !== resumeIds.length) {
      throw new NotFoundException('One or more resume projects were not found');
    }
    if (rows.some((r) => r.profile.userId !== userId)) {
      throw new ForbiddenException();
    }
  }

  async exportBackup(
    userId: string,
    body: unknown,
  ): Promise<StackfolioBackup> {
    const parsed = backupExportRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid export request');
    }
    const request = parsed.data;
    return this.buildExportDocument(userId, request);
  }

  private async buildExportDocument(
    userId: string,
    request: BackupExportRequest,
  ): Promise<StackfolioBackup> {
    const profileIds = new Set<string>();
    const resumeIds = new Set<string>();

    if (request.mode === 'profiles_and_resumes') {
      const ids = request.profileIds ?? [];
      await this.assertProfilesOwned(userId, ids);
      ids.forEach((id) => profileIds.add(id));
      const resumes = await this.prisma.resumeProject.findMany({
        where: { profileId: { in: ids } },
        select: { id: true, profileId: true },
      });
      resumes.forEach((r) => resumeIds.add(r.id));
    } else if (request.mode === 'profiles_only') {
      const ids = request.profileIds ?? [];
      await this.assertProfilesOwned(userId, ids);
      ids.forEach((id) => profileIds.add(id));
    } else {
      const ids = request.resumeProjectIds ?? [];
      await this.assertResumesOwned(userId, ids);
      ids.forEach((id) => resumeIds.add(id));
      const resumes = await this.prisma.resumeProject.findMany({
        where: { id: { in: ids } },
        select: { profileId: true },
      });
      resumes.forEach((r) => profileIds.add(r.profileId));
    }

    const profiles = profileIds.size
      ? await this.prisma.profile.findMany({
          where: { id: { in: [...profileIds] }, userId },
          include: profileExportInclude,
        })
      : [];

    const resumeProjects = resumeIds.size
      ? await this.prisma.resumeProject.findMany({
          where: { id: { in: [...resumeIds] } },
        })
      : [];

    return {
      stackfolioBackupVersion: STACKFOLIO_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      profiles: profiles.map(serializeProfileForBackup),
      resumeProjects: resumeProjects.map(serializeResumeForBackup),
    };
  }

  async importBackup(userId: string, body: unknown): Promise<BackupImportResult> {
    const parsed = parseStackfolioBackup(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.message);
    }
    const backup = parsed.data;
    const warnings: string[] = [];

    const existingProfiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { name: true },
    });
    const usedNames = new Set(existingProfiles.map((p) => p.name));

    const skillRows = await this.prisma.skill.findMany({
      select: { id: true, slug: true },
    });
    const slugToSkillId = new Map(skillRows.map((s) => [s.slug, s.id]));

    const exportIdToProfileId = new Map<string, string>();
    const usedResumeNamesByProfileId = new Map<string, Set<string>>();

    const sortedProfiles = [...backup.profiles].sort((a, b) => {
      const aHasParent = a.basedOnExportId ? 1 : 0;
      const bHasParent = b.basedOnExportId ? 1 : 0;
      return aHasParent - bHasParent;
    });

    let profilesCreated = 0;
    let resumeProjectsCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const record of sortedProfiles) {
        const uniqueName = resolveUniqueImportedName(record.name, usedNames);
        usedNames.add(uniqueName);

        let basedOnProfileId: string | null = null;
        if (record.basedOnExportId) {
          basedOnProfileId =
            exportIdToProfileId.get(record.basedOnExportId) ?? null;
        }

        const validation = validateProfileIdentity(record.profileData);
        const profileData = validation.success
          ? validation.data!
          : parseProfileIdentity(record.profileData);
        if (!validation.success) {
          warnings.push(
            `Profile "${uniqueName}" used lenient profile data (validation issues)`,
          );
        }

        const created = await tx.profile.create({
          data: {
            userId,
            name: uniqueName,
            isMain: false,
            basedOnProfileId,
            profileData: identityToPrismaJson(profileData),
          },
        });
        exportIdToProfileId.set(record.exportId, created.id);
        profilesCreated += 1;

        for (const skill of record.skills) {
          const skillId = slugToSkillId.get(skill.skillSlug);
          if (!skillId) {
            warnings.push(
              `Skipped skill "${skill.skillSlug}" for profile "${uniqueName}" (not in catalog)`,
            );
            continue;
          }
          await tx.profileSkill.create({
            data: {
              profileId: created.id,
              skillId,
              level: skill.level as SkillLevel,
              years: skill.years ?? null,
              highlight: skill.highlight ?? false,
              displayCategory: skill.displayCategory?.trim() || null,
            },
          });
        }
      }

      for (const resume of backup.resumeProjects) {
        const profileId = exportIdToProfileId.get(resume.profileExportId);
        if (!profileId) {
          warnings.push(
            `Skipped resume "${resume.name}" (profile mapping missing)`,
          );
          continue;
        }
        let usedResumeNames = usedResumeNamesByProfileId.get(profileId);
        if (!usedResumeNames) {
          const existingResumes = await tx.resumeProject.findMany({
            where: { profileId },
            select: { name: true },
          });
          usedResumeNames = new Set(existingResumes.map((row) => row.name));
          usedResumeNamesByProfileId.set(profileId, usedResumeNames);
        }
        const uniqueResumeName = resolveUniqueImportedName(
          resume.name,
          usedResumeNames,
        );
        usedResumeNames.add(uniqueResumeName);

        await tx.resumeProject.create({
          data: {
            profileId,
            name: uniqueResumeName,
            theme: resume.theme,
            font: resume.font,
            spacing: resume.spacing,
            sectionOrder: resume.sectionOrder as Prisma.InputJsonValue,
            visibility: resume.visibility as Prisma.InputJsonValue,
            dividerStyle: resume.dividerStyle,
            pageCount: resume.pageCount,
            jsonLayout: resume.jsonLayout as Prisma.InputJsonValue,
          },
        });
        resumeProjectsCreated += 1;
      }
    });

    if (
      profilesCreated === 0 &&
      resumeProjectsCreated === 0 &&
      backup.profiles.length + backup.resumeProjects.length > 0
    ) {
      throw new BadRequestException(
        'Nothing was imported. Check warnings or backup structure.',
      );
    }

    return { profilesCreated, resumeProjectsCreated, warnings };
  }
}
