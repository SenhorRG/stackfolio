import { PrismaClient, SkillLevel } from '@prisma/client';
import { hash } from 'bcryptjs';
import {
  DEFAULT_SECTION_ORDER,
  emptyProfileIdentity,
  ResumeSectionId,
} from '@stackfolio/shared';
import { identityToPrismaJson } from '../../src/features/profiles/copy-profile-data';

export type DefaultUserSeedConfig = {
  userId: string;
  email: string;
  password: string;
};

export function resolveDefaultUserSeedConfig(): DefaultUserSeedConfig {
  return {
    userId: process.env.DEFAULT_USER_ID ?? 'dev-user-001',
    email: process.env.DEV_AUTH_EMAIL ?? 'dev@stackfolio.local',
    password: process.env.DEV_AUTH_PASSWORD ?? 'devpassword',
  };
}

function buildFullDefaultIdentity(
  email: string,
): ReturnType<typeof emptyProfileIdentity> {
  const identity = emptyProfileIdentity();
  identity.jobTitle = 'Full Stack Engineer';
  identity.summary =
    'Full-stack engineer with 8+ years building scalable web applications, APIs, and developer tooling. Passionate about clean architecture, ATS-safe resumes, and measurable delivery.';
  identity.contact = {
    email,
    phone: '+55 (11) 9 8765-4321',
    location: 'São Paulo, Brazil (Remote-friendly)',
  };
  identity.experience = [
    {
      company: 'Acme Corp',
      role: 'Senior Full Stack Engineer',
      period: '2021 – Present',
      description:
        'Led migration of legacy monolith to modular NestJS services\nShipped PDF resume export used by 12k monthly active users\nMentored 4 engineers on code review and testing practices',
    },
    {
      company: 'Beta Labs',
      role: 'Software Engineer',
      period: '2018 – 2021',
      description:
        'Built React dashboards and GraphQL APIs for B2B clients\nReduced CI pipeline time by 35% through parallelized builds',
    },
  ];
  identity.education = [
    {
      institution: 'State University of Technology',
      degree: 'B.S. Computer Science',
      period: '2014 – 2018',
      description: 'Focus on distributed systems and software engineering.',
    },
  ];
  identity.projects = [
    {
      name: 'Stackfolio',
      url: 'https://github.com/stackfolio',
      description:
        'Monorepo for profile-driven resume authoring with skill graph learning suggestions.',
    },
    {
      name: 'Open Metrics Kit',
      url: 'https://github.com/example/open-metrics-kit',
      description: 'Lightweight observability helpers for Node.js services.',
    },
  ];
  identity.certificates = [
    {
      name: 'AWS Certified Developer – Associate',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ];
  identity.languages = [
    { name: 'English', level: 'Fluent' },
    { name: 'Portuguese', level: 'Native' },
    { name: 'Spanish', level: 'Intermediate' },
  ];
  identity.links = [
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'LinkedIn', url: 'https://linkedin.com' },
    { label: 'Portfolio', url: 'https://example.com' },
  ];
  return identity;
}

export async function seedDefaultUser(
  prisma: PrismaClient,
  skillMap: Map<string, string>,
  config: DefaultUserSeedConfig = resolveDefaultUserSeedConfig(),
): Promise<void> {
  const email = config.email.trim().toLowerCase();
  const passwordHash = await hash(config.password, 10);
  const defaultIdentity = buildFullDefaultIdentity(email);

  await prisma.user.upsert({
    where: { id: config.userId },
    create: {
      id: config.userId,
      email,
      passwordHash,
      passwordCredentialSet: true,
      name: 'Dev User',
      settings: { create: {} },
    },
    update: {
      email,
      passwordHash,
      passwordCredentialSet: true,
      name: 'Dev User',
    },
  });

  await prisma.userSettings.upsert({
    where: { userId: config.userId },
    create: { userId: config.userId },
    update: {},
  });

  let mainProfile = await prisma.profile.findFirst({
    where: { userId: config.userId, isMain: true },
  });

  if (!mainProfile) {
    mainProfile = await prisma.profile.create({
      data: {
        userId: config.userId,
        name: 'Main Profile',
        isMain: true,
        profileData: identityToPrismaJson(defaultIdentity),
      },
    });
  } else {
    await prisma.profile.update({
      where: { id: mainProfile.id },
      data: { profileData: identityToPrismaJson(defaultIdentity) },
    });
  }

  const stackSlugs = ['react', 'typescript', 'nodejs', 'postgresql', 'nestjs'];
  for (const slug of stackSlugs) {
    const skillId = skillMap.get(slug);
    if (!skillId) continue;
    await prisma.profileSkill.upsert({
      where: {
        profileId_skillId: {
          profileId: mainProfile.id,
          skillId,
        },
      },
      create: {
        profileId: mainProfile.id,
        skillId,
        level: SkillLevel.advanced,
        years: 3,
        highlight: slug === 'react' || slug === 'typescript',
      },
      update: {},
    });
  }

  const visibility = Object.fromEntries(
    ResumeSectionId.map((id) => [id, true]),
  );

  const existingProject = await prisma.resumeProject.findFirst({
    where: { profileId: mainProfile.id },
  });

  if (!existingProject) {
    await prisma.resumeProject.create({
      data: {
        profileId: mainProfile.id,
        name: 'Default Resume',
        sectionOrder: DEFAULT_SECTION_ORDER,
        visibility,
        jsonLayout: {
          sections: {
            header: {
              fullName: 'Stackfolio Developer',
              title: 'Full Stack Engineer',
              email: config.email,
              phone: defaultIdentity.contact.phone ?? '',
              location: defaultIdentity.contact.location ?? '',
            },
            summary: { text: defaultIdentity.summary },
            skills: { display: 'comma', items: [] },
            experience: {
              items: defaultIdentity.experience.map((exp) => ({
                company: exp.company,
                role: exp.role,
                bullets: exp.description
                  ?.split('\n')
                  .map((l) => l.replace(/^[\s•\-*]+\s*/, '').trim())
                  .filter(Boolean),
              })),
            },
            education: { items: defaultIdentity.education },
            projects: { items: defaultIdentity.projects },
            certifications: { items: defaultIdentity.certificates },
            languages: { items: defaultIdentity.languages },
            links: { items: defaultIdentity.links },
          },
        },
      },
    });
  }

  await prisma.userSettings.upsert({
    where: { userId: config.userId },
    create: { userId: config.userId },
    update: {},
  });

  console.log('Default dev user seeded:', config.userId, email);
}
