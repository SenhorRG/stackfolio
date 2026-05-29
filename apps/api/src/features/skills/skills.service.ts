import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildMergedSkillUpdate,
  bulkUpdateSkillCategorySchema,
  createCustomSkillInputSchema,
  mergeSkillsInputSchema,
  resolveCustomSkillCategory,
  resolveCustomSkillSlug,
  slugifySkillName,
  updateSkillAdminSchema,
  type BulkUpdateSkillCategoryInput,
  type CreateCustomSkillInput,
  type MergeSkillsInput,
  type UpdateSkillAdminInput,
} from '@stackfolio/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { buildSkillExportPayload } from './build-skill-export';
import { collectUniqueCategories, isValidSkillCategory } from './skill-category';
import { ensureUniqueSkillSlug } from './ensure-unique-skill-slug';
import { mapSkillResponse } from './map-skill-response';
import { parseSkillResources } from './skill-resources';
import {
  migrateProfileSkillsOnMerge,
  migrateSkillRelationsOnMerge,
  toSkillMergeSnapshot,
} from './merge-skills';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    q?: string;
    category?: string;
    limit: number;
    offset: number;
  }) {
    const and: Prisma.SkillWhereInput[] = [];
    if (params.category) {
      and.push({
        resources: {
          path: ['categories'],
          array_contains: params.category,
        },
      });
    }
    if (params.q) {
      and.push({
        OR: [
          { name: { contains: params.q, mode: 'insensitive' } },
          { slug: { contains: params.q, mode: 'insensitive' } },
          { category: { contains: params.q, mode: 'insensitive' } },
          { description: { contains: params.q, mode: 'insensitive' } },
        ],
      });
    }
    const where: Prisma.SkillWhereInput = and.length > 0 ? { AND: and } : {};
    const [items, total] = await Promise.all([
      this.prisma.skill.findMany({
        where,
        take: params.limit,
        skip: params.offset,
        orderBy: { name: 'asc' },
      }),
      this.prisma.skill.count({ where }),
    ]);
    return { items: items.map(mapSkillResponse), total };
  }

  async findBySlug(slug: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      include: {
        relationsFrom: { include: { target: true } },
        relationsTo: { include: { source: true } },
      },
    });
    if (!skill) throw new NotFoundException(`Skill ${slug} not found`);
    const { relationsFrom, relationsTo, ...row } = skill;
    return {
      ...mapSkillResponse(row),
      relationsFrom,
      relationsTo,
    };
  }

  async findById(id: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) throw new NotFoundException(`Skill ${id} not found`);
    return mapSkillResponse(skill);
  }

  async categories() {
    const rows = await this.prisma.skill.findMany({
      select: { resources: true },
    });
    const all: string[] = [];
    for (const row of rows) {
      const resources = parseSkillResources(row.resources);
      for (const cat of resources.categories ?? []) {
        all.push(cat);
      }
    }
    return collectUniqueCategories(all);
  }

  async create(input: CreateCustomSkillInput) {
    const parsed = createCustomSkillInputSchema.parse(input);
    const slug = resolveCustomSkillSlug(parsed);
    const existing = await this.prisma.skill.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Skill with slug "${slug}" already exists`);
    }
    const category = resolveCustomSkillCategory(parsed);
    const row = await this.prisma.skill.create({
      data: {
        name: parsed.name.trim(),
        slug,
        category,
        description: parsed.description?.trim() || null,
        resources: { categories: [category] },
      },
    });
    return mapSkillResponse(row);
  }

  /** Resolves a catalog skill by name or slug; does not create rows. */
  async findExistingByName(name: string) {
    const row = await this.findSkillRowByName(name);
    return row ? mapSkillResponse(row) : null;
  }

  private async findSkillRowByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const byName = await this.prisma.skill.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (byName) return byName;
    const baseSlug = slugifySkillName(trimmed);
    return this.prisma.skill.findUnique({ where: { slug: baseSlug } });
  }

  async findOrCreateByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConflictException('Skill name cannot be empty');
    }
    const existing = await this.findSkillRowByName(trimmed);
    if (existing) return mapSkillResponse(existing);

    const baseSlug = slugifySkillName(trimmed);
    const slug = await ensureUniqueSkillSlug(this.prisma, baseSlug);
    const category = resolveCustomSkillCategory({ name: trimmed });
    const row = await this.prisma.skill.create({
      data: {
        name: trimmed,
        slug,
        category,
        description: null,
        resources: { categories: [category] },
      },
    });
    return mapSkillResponse(row);
  }

  async exportCatalog() {
    const rows = await this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
    return buildSkillExportPayload(rows);
  }

  async update(id: string, input: UpdateSkillAdminInput) {
    const row = await this.applyAdminUpdate(this.prisma, id, input);
    return mapSkillResponse(row);
  }

  private async applyAdminUpdate(
    db: Prisma.TransactionClient | PrismaService,
    id: string,
    input: UpdateSkillAdminInput,
  ) {
    const parsed = updateSkillAdminSchema.parse(input);
    const existing = await db.skill.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Skill ${id} not found`);

    const data: Prisma.SkillUpdateInput = {};

    if (parsed.name !== undefined) {
      data.name = parsed.name.trim();
    }
    if (parsed.description !== undefined) {
      data.description = parsed.description;
    }
    if (parsed.urls !== undefined) {
      data.urls = (parsed.urls ?? Prisma.JsonNull) as Prisma.InputJsonValue;
    }
    if (parsed.category !== undefined) {
      const category = parsed.category.trim();
      if (!isValidSkillCategory(category)) {
        throw new BadRequestException(`Invalid category "${category}"`);
      }
      data.category = category;
    }
    if (parsed.resources !== undefined) {
      data.resources = parsed.resources as Prisma.InputJsonValue;
    } else if (parsed.category !== undefined) {
      const current = parseSkillResources(existing.resources);
      data.resources = {
        ...current,
        categories: [parsed.category.trim()],
      } as Prisma.InputJsonValue;
    }
    if (parsed.slug !== undefined) {
      const slug = parsed.slug.trim();
      if (slug !== existing.slug) {
        const taken = await db.skill.findUnique({ where: { slug } });
        if (taken && taken.id !== id) {
          throw new ConflictException(`Skill with slug "${slug}" already exists`);
        }
        data.slug = slug;
      }
    }

    return db.skill.update({ where: { id }, data });
  }

  async bulkUpdateCategory(input: BulkUpdateSkillCategoryInput) {
    const parsed = bulkUpdateSkillCategorySchema.parse(input);
    const category = parsed.category.trim();
    if (!isValidSkillCategory(category)) {
      throw new BadRequestException(`Invalid category "${category}"`);
    }

    const uniqueIds: string[] = [...new Set(parsed.skillIds)];
    const rows = await this.prisma.skill.findMany({
      where: { id: { in: uniqueIds } },
    });
    if (rows.length !== uniqueIds.length) {
      throw new BadRequestException('One or more skills were not found');
    }

    await this.prisma.$transaction(
      rows.map((row) => {
        const resources = parseSkillResources(row.resources);
        return this.prisma.skill.update({
          where: { id: row.id },
          data: {
            category,
            resources: {
              ...resources,
              categories: [category],
            } as Prisma.InputJsonValue,
          },
        });
      }),
    );

    return { updated: rows.length, category };
  }

  async merge(input: MergeSkillsInput) {
    const parsed = mergeSkillsInputSchema.parse(input);
    const [preferredRow, secondaryRow] = await Promise.all([
      this.prisma.skill.findUnique({ where: { id: parsed.preferredSkillId } }),
      this.prisma.skill.findUnique({ where: { id: parsed.secondarySkillId } }),
    ]);
    if (!preferredRow) {
      throw new NotFoundException(
        `Preferred skill ${parsed.preferredSkillId} not found`,
      );
    }
    if (!secondaryRow) {
      throw new NotFoundException(
        `Secondary skill ${parsed.secondarySkillId} not found`,
      );
    }

    const preferred = mapSkillResponse(preferredRow);
    const secondary = mapSkillResponse(secondaryRow);
    const updatePayload = buildMergedSkillUpdate(
      toSkillMergeSnapshot(preferred),
      toSkillMergeSnapshot(secondary),
      parsed.adoptFromSecondary,
    );

    const profileMigration = await this.prisma.$transaction(async (tx) => {
      await this.applyAdminUpdate(tx, parsed.preferredSkillId, updatePayload);
      const migration = await migrateProfileSkillsOnMerge(
        tx,
        parsed.preferredSkillId,
        parsed.secondarySkillId,
      );
      await migrateSkillRelationsOnMerge(
        tx,
        parsed.preferredSkillId,
        parsed.secondarySkillId,
      );
      await tx.skill.delete({ where: { id: parsed.secondarySkillId } });
      return migration;
    });

    const merged = await this.findById(parsed.preferredSkillId);
    return {
      merged,
      deletedSkillId: parsed.secondarySkillId,
      profileSkills: profileMigration,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.skill.findUnique({
      where: { id },
      include: { _count: { select: { profileSkills: true } } },
    });
    if (!existing) throw new NotFoundException(`Skill ${id} not found`);

    try {
      await this.prisma.skill.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Skill cannot be deleted because it is still referenced',
        );
      }
      throw error;
    }

    return {
      deleted: true,
      id,
      profileSkillsRemoved: existing._count.profileSkills,
    };
  }
}
