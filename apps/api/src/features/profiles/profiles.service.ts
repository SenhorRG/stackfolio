import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, SkillLevel } from '@prisma/client';
import {
  emptyProfileIdentity,
  parseProfileIdentity,
  validateProfileIdentity,
  ProfileIdentity,
} from '@stackfolio/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  copyProfileIdentityFrom,
  copySkillsFromProfile,
  identityToPrismaJson,
} from './copy-profile-data';
import { mapProfileWithSkills } from './map-profile-response';
import { ProfilePdfImportService } from './pdf/profile-pdf-import.service';
import { applyParsedProfileToProfile } from './pdf/apply-parsed-profile';

const profileInclude = {
  skills: { include: { skill: true } },
  _count: { select: { resumeProjects: true } },
} satisfies Prisma.ProfileInclude;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfImport: ProfilePdfImportService,
  ) {}

  async listForUser(userId: string) {
    const rows = await this.prisma.profile.findMany({
      where: { userId },
      orderBy: [{ isMain: 'desc' }, { updatedAt: 'desc' }],
      include: profileInclude,
    });
    return rows.map(mapProfileWithSkills);
  }

  async getMainProfile(userId: string) {
    const main = await this.prisma.profile.findFirst({
      where: { userId, isMain: true },
      include: profileInclude,
    });
    if (!main) throw new NotFoundException('Main profile not found');
    return mapProfileWithSkills(main);
  }

  async getById(userId: string, id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: profileInclude,
    });
    if (!profile) throw new NotFoundException('Profile not found');
    if (profile.userId !== userId) throw new ForbiddenException();
    return mapProfileWithSkills(profile);
  }

  async create(
    userId: string,
    data: { name: string; basedOnProfileId?: string; copyFromMain?: boolean },
  ) {
    let baseId = data.basedOnProfileId;
    if (data.copyFromMain) {
      const main = await this.getMainProfile(userId);
      baseId = main.id;
    }

    if (baseId) {
      const base = await this.getById(userId, baseId);
      const profile = await this.prisma.profile.create({
        data: {
          userId,
          name: data.name,
          basedOnProfileId: base.id,
          isMain: false,
          profileData: identityToPrismaJson(
            copyProfileIdentityFrom(base.profileData),
          ),
        },
      });
      await copySkillsFromProfile(this.prisma, base.id, profile.id);
      return this.getById(userId, profile.id);
    }

    const profile = await this.prisma.profile.create({
      data: {
        userId,
        name: data.name,
        isMain: false,
        profileData: identityToPrismaJson(emptyProfileIdentity()),
      },
      include: profileInclude,
    });
    return mapProfileWithSkills(profile);
  }

  async duplicate(userId: string, id: string, name?: string) {
    const source = await this.getById(userId, id);
    const profile = await this.prisma.profile.create({
      data: {
        userId,
        name: name ?? `${source.name} (copy)`,
        isMain: false,
        basedOnProfileId: source.basedOnProfileId,
        profileData: identityToPrismaJson(
          copyProfileIdentityFrom(source.profileData),
        ),
      },
    });
    await copySkillsFromProfile(this.prisma, source.id, profile.id);
    return this.getById(userId, profile.id);
  }

  async update(userId: string, id: string, data: { name?: string }) {
    const profile = await this.getById(userId, id);
    if (data.name === undefined) {
      return profile;
    }
    if (profile.isMain && data.name === '') {
      throw new BadRequestException('Main profile name cannot be empty');
    }
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { name: data.name },
      include: profileInclude,
    });
    return mapProfileWithSkills(updated);
  }

  async parsePdf(file: Express.Multer.File | undefined) {
    const buffer = this.pdfImport.assertPdfFile(file);
    return this.pdfImport.parsePdfBuffer(buffer);
  }

  async createFromPdf(
    userId: string,
    name: string,
    file: Express.Multer.File | undefined,
  ) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Profile name is required');
    }
    const buffer = this.pdfImport.assertPdfFile(file);
    const parsed = await this.pdfImport.parsePdfBuffer(buffer);
    const profile = await this.prisma.profile.create({
      data: {
        userId,
        name: trimmed,
        isMain: false,
        profileData: identityToPrismaJson(parsed.identity),
      },
    });
    const { skillIds, warnings: skillWarnings } =
      await this.pdfImport.resolveSkillIds(parsed.skillNames);
    await applyParsedProfileToProfile(this.prisma, profile.id, parsed, skillIds, {
      suggestedProfileName: parsed.suggestedProfileName,
    });
    return {
      profile: await this.getById(userId, profile.id),
      warnings: [...parsed.warnings, ...skillWarnings],
    };
  }

  async importFromPdf(
    userId: string,
    id: string,
    file: Express.Multer.File | undefined,
  ) {
    const buffer = this.pdfImport.assertPdfFile(file);
    const parsed = await this.pdfImport.parsePdfBuffer(buffer);
    await this.getById(userId, id);
    const { skillIds, warnings: skillWarnings } =
      await this.pdfImport.resolveSkillIds(parsed.skillNames);
    await applyParsedProfileToProfile(this.prisma, id, parsed, skillIds, {
      suggestedProfileName: parsed.suggestedProfileName,
    });
    return {
      profile: await this.getById(userId, id),
      warnings: [...parsed.warnings, ...skillWarnings],
    };
  }

  async copyFromMain(userId: string, id: string) {
    const profile = await this.getById(userId, id);
    if (profile.isMain) {
      throw new BadRequestException('Main profile cannot copy from itself');
    }
    const main = await this.getMainProfile(userId);
    await this.prisma.profile.update({
      where: { id },
      data: {
        profileData: identityToPrismaJson(
          copyProfileIdentityFrom(main.profileData),
        ),
      },
    });
    await this.prisma.profileSkill.deleteMany({ where: { profileId: id } });
    await copySkillsFromProfile(this.prisma, main.id, id);
    return this.getById(userId, id);
  }

  async updateProfileData(
    userId: string,
    id: string,
    profileData: ProfileIdentity,
  ) {
    await this.getById(userId, id);
    const validation = validateProfileIdentity(profileData);
    if (!validation.success) {
      throw new BadRequestException({
        message: 'Invalid profile data',
        errors: validation.fieldErrors,
      });
    }
    const parsed = validation.data!;
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { profileData: identityToPrismaJson(parsed) },
      include: profileInclude,
    });
    return mapProfileWithSkills(updated);
  }

  async remove(userId: string, id: string) {
    const profile = await this.getById(userId, id);
    if (profile.isMain) {
      throw new BadRequestException('Cannot delete main profile');
    }
    await this.prisma.profile.delete({ where: { id } });
    return { deleted: true };
  }

  async upsertSkill(
    userId: string,
    profileId: string,
    data: {
      skillId: string;
      level: SkillLevel;
      years?: number;
      highlight?: boolean;
      displayCategory?: string | null;
    },
  ) {
    await this.getById(userId, profileId);
    const skillId = data.skillId;
    const key = { profileId, skillId };
    const payload = {
      level: data.level,
      years: data.years,
      highlight: data.highlight ?? false,
      displayCategory: data.displayCategory?.trim() || null,
    };

    const existing = await this.prisma.profileSkill.findUnique({
      where: { profileId_skillId: key },
    });

    const row = existing
      ? await this.prisma.profileSkill.update({
          where: { profileId_skillId: key },
          data: payload,
          include: { skill: true },
        })
      : await this.prisma.profileSkill.create({
          data: { ...key, ...payload },
          include: { skill: true },
        });

    return {
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
      },
    };
  }

  async removeSkill(userId: string, profileId: string, skillId: string) {
    await this.getById(userId, profileId);
    await this.prisma.profileSkill.delete({
      where: { profileId_skillId: { profileId, skillId } },
    });
    return { deleted: true };
  }

  private async ensureUserSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        'Session is invalid or outdated. Please sign out and sign in again.',
      );
    }
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async trackRecent(userId: string, profileId: string) {
    await this.getById(userId, profileId);
    const settings = await this.ensureUserSettings(userId);
    const recent = Array.isArray(settings.recentProfileIds)
      ? (settings.recentProfileIds as string[])
      : [];
    const next = [profileId, ...recent.filter((rid) => rid !== profileId)].slice(
      0,
      5,
    );
    return this.prisma.userSettings.update({
      where: { userId },
      data: { recentProfileIds: next },
    });
  }
}
