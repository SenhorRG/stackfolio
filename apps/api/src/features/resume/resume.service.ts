import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  buildResumeLayoutFromProfile,
  DEFAULT_SECTION_ORDER,
  mergeProfileIntoLayout,
  ResumeSectionId,
  type JsonLayoutShape,
} from '@stackfolio/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toResumeProjectUpdateInput } from './resume-update.mapper';

const defaultVisibility = Object.fromEntries(
  ResumeSectionId.map((id) => [id, true]),
) as Record<string, boolean>;

@Injectable()
export class ResumeService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProfileOwner(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    if (profile.userId !== userId) throw new ForbiddenException();
    return profile;
  }

  async listForProfile(userId: string, profileId: string) {
    await this.assertProfileOwner(userId, profileId);
    return this.prisma.resumeProject.findMany({
      where: { profileId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getById(userId: string, id: string) {
    const project = await this.prisma.resumeProject.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!project) throw new NotFoundException('Resume project not found');
    if (project.profile.userId !== userId) throw new ForbiddenException();
    return project;
  }

  async create(
    userId: string,
    data: {
      profileId: string;
      name?: string;
      theme?: string;
      font?: string;
      spacing?: string;
    },
  ) {
    await this.assertProfileOwner(userId, data.profileId);
    const profile = await this.prisma.profile.findUnique({
      where: { id: data.profileId },
      include: { skills: { include: { skill: true } } },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    const jsonLayout = buildResumeLayoutFromProfile(
      {
        name: profile.name,
        profileData: profile.profileData,
        skills: profile.skills,
      },
      data.spacing ?? 'normal',
    );
    return this.prisma.resumeProject.create({
      data: {
        profileId: data.profileId,
        name: data.name ?? 'My Resume',
        theme: data.theme ?? 'classic',
        font: data.font ?? 'inter',
        spacing: data.spacing ?? 'normal',
        sectionOrder: DEFAULT_SECTION_ORDER,
        visibility: defaultVisibility,
        dividerStyle: 'line',
        pageCount: 1,
        jsonLayout: jsonLayout as Prisma.InputJsonValue,
      },
    });
  }

  async update(userId: string, id: string, body: Record<string, unknown>) {
    await this.getById(userId, id);
    const data = toResumeProjectUpdateInput(body);
    return this.prisma.resumeProject.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.resumeProject.delete({ where: { id } });
    return { ok: true };
  }

  async duplicate(userId: string, id: string) {
    const project = await this.getById(userId, id);
    return this.prisma.resumeProject.create({
      data: {
        profileId: project.profileId,
        name: `${project.name} (copy)`,
        theme: project.theme,
        font: project.font,
        spacing: project.spacing,
        sectionOrder: project.sectionOrder as Prisma.InputJsonValue,
        visibility: project.visibility as Prisma.InputJsonValue,
        dividerStyle: project.dividerStyle,
        pageCount: project.pageCount,
        jsonLayout: project.jsonLayout as Prisma.InputJsonValue,
      },
    });
  }

  async autofillFromProfile(userId: string, id: string) {
    const project = await this.getById(userId, id);
    const profile = await this.prisma.profile.findUnique({
      where: { id: project.profileId },
      include: { skills: { include: { skill: true } } },
    });
    if (!profile) throw new NotFoundException();
    const current = (project.jsonLayout ?? {}) as JsonLayoutShape;
    const jsonLayout = mergeProfileIntoLayout(current, {
      name: profile.name,
      profileData: profile.profileData,
      skills: profile.skills,
    });
    return this.prisma.resumeProject.update({
      where: { id },
      data: { jsonLayout: jsonLayout as Prisma.InputJsonValue },
    });
  }

  async trackRecent(userId: string, projectId: string) {
    await this.getById(userId, projectId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        'Session is invalid or outdated. Please sign out and sign in again.',
      );
    }
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, recentResumeIds: [projectId] },
      update: {},
    });
    const recent = Array.isArray(settings.recentResumeIds)
      ? (settings.recentResumeIds as string[])
      : [];
    const next = [projectId, ...recent.filter((rid) => rid !== projectId)].slice(
      0,
      6,
    );
    return this.prisma.userSettings.update({
      where: { userId },
      data: { recentResumeIds: next },
    });
  }
}
