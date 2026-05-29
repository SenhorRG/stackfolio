import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';

export async function ensureUniqueSkillSlug(
  prisma: PrismaService,
  slug: string,
  excludeId?: string,
): Promise<string> {
  let candidate = slug;
  let suffix = 2;
  while (true) {
    const existing = await prisma.skill.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    if (suffix > 99) {
      throw new ConflictException('Could not generate a unique slug for this skill');
    }
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }
}
