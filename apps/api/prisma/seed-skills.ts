import { Prisma, PrismaClient, RelationType } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pickPrimaryCategory } from '../src/features/skills/skill-category';
import { normalizeSkillKey } from './seed/normalize-skill-key';

type SkillSeedEntry = {
  name: string;
  slug: string;
  description: string;
  score?: number;
  relationships?: string[];
  categories?: string[];
  ebooks?: Record<string, string[]>;
  articles?: Record<string, string[]>;
  sites?: string[];
  repositories?: string[];
  officialDocs?: string[];
  officialLinks?: string[];
  links?: string[];
};

type SkillsSeedFile = {
  skills: SkillSeedEntry[];
};

const SEED_PATH = join(__dirname, 'data', 'skills-seed.json');
const BATCH = 200;

function loadSeed(): SkillsSeedFile {
  const raw = readFileSync(SEED_PATH, 'utf-8');
  return JSON.parse(raw) as SkillsSeedFile;
}

function buildUrls(entry: SkillSeedEntry): Prisma.InputJsonValue | undefined {
  const urls: Record<string, string> = {};
  if (entry.officialLinks?.[0]) urls.official = entry.officialLinks[0];
  if (entry.officialDocs?.[0]) urls.docs = entry.officialDocs[0];
  if (entry.repositories?.[0]) urls.github = entry.repositories[0];
  return Object.keys(urls).length ? (urls as Prisma.InputJsonValue) : undefined;
}

function buildResources(entry: SkillSeedEntry): Prisma.InputJsonValue {
  return {
    categories: entry.categories ?? [],
    relationships: entry.relationships ?? [],
    ebooks: entry.ebooks ?? {},
    articles: entry.articles ?? {},
    sites: entry.sites ?? [],
    repositories: entry.repositories ?? [],
    officialDocs: entry.officialDocs ?? [],
    officialLinks: entry.officialLinks ?? [],
    links: entry.links ?? [],
  } as Prisma.InputJsonValue;
}

export async function seedSkills(
  prisma: PrismaClient,
): Promise<Map<string, string>> {
  const { skills } = loadSeed();
  const skillMap = new Map<string, string>();
  const keyToSlug = new Map<string, string>();

  for (const t of skills) {
    keyToSlug.set(normalizeSkillKey(t.name), t.slug);
    keyToSlug.set(normalizeSkillKey(t.slug), t.slug);
  }

  for (let i = 0; i < skills.length; i += BATCH) {
    const chunk = skills.slice(i, i + BATCH);
    const rows = await prisma.$transaction(
      chunk.map((t) => {
        const category = pickPrimaryCategory(t.categories);
        return prisma.skill.upsert({
          where: { slug: t.slug },
          create: {
            name: t.name,
            slug: t.slug,
            category,
            description: t.description ?? null,
            urls: buildUrls(t),
            resources: buildResources(t),
          },
          update: {
            name: t.name,
            category,
            description: t.description ?? null,
            urls: buildUrls(t),
            resources: buildResources(t),
          },
          select: { id: true, slug: true },
        });
      }),
    );
    for (const row of rows) skillMap.set(row.slug, row.id);
    if ((i + BATCH) % 1000 === 0 || i + BATCH >= skills.length) {
      console.log(
        `Seeded skills ${Math.min(i + BATCH, skills.length)}/${skills.length}`,
      );
    }
  }

  const relationType = RelationType.related;
  const seedSlugs = skills.map((t) => t.slug);
  const removed = await prisma.skill.deleteMany({
    where: { slug: { notIn: seedSlugs } },
  });
  if (removed.count > 0) {
    console.log(
      `Removed ${removed.count} skills not present in skills-seed.json`,
    );
  }

  await prisma.skillRelation.deleteMany();

  for (const t of skills) {
    const sourceId = skillMap.get(t.slug);
    if (!sourceId || !t.relationships?.length) continue;
    for (const relName of t.relationships) {
      const targetSlug = keyToSlug.get(normalizeSkillKey(relName));
      const targetId = targetSlug ? skillMap.get(targetSlug) : undefined;
      if (!targetId || targetId === sourceId) continue;
      await prisma.skillRelation.upsert({
        where: {
          sourceId_targetId_relationType: {
            sourceId,
            targetId,
            relationType,
          },
        },
        create: { sourceId, targetId, relationType },
        update: {},
      });
    }
  }

  console.log(`Skill relations synced for ${skills.length} entries`);

  const dbCount = await prisma.skill.count();
  if (dbCount !== skills.length) {
    console.warn(
      `Seed count mismatch: JSON has ${skills.length}, database has ${dbCount}`,
    );
  } else {
    console.log(`Verified ${dbCount} skills in database (matches seed file)`);
  }

  return skillMap;
}
