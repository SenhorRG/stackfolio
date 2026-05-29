import { describe, expect, it } from 'vitest';
import { bulkUpdateSkillCategorySchema } from './skills/bulk-update-skill-category-schema';
import { createCustomSkillInputSchema } from './skills/create-custom-skill-schema';
import { updateSkillAdminSchema } from './skills/update-skill-admin-schema';
import { listSkillsQuerySchema } from './entities/skill';
import { upsertProfileSkillSchema } from './entities/profile-skill';

describe('shared schemas', () => {
  it('validates custom skill create', () => {
    const result = createCustomSkillInputSchema.safeParse({
      name: 'React',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid custom skill slug', () => {
    const result = createCustomSkillInputSchema.safeParse({
      name: 'Bad',
      slug: 'Bad Slug',
    });
    expect(result.success).toBe(false);
  });

  it('validates list skills query', () => {
    const result = listSkillsQuerySchema.safeParse({
      limit: '10',
      offset: '0',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('validates profile skill upsert', () => {
    const result = upsertProfileSkillSchema.safeParse({
      skillId: 'skill1',
      level: 'advanced',
    });
    expect(result.success).toBe(true);
  });

  it('validates skill admin update', () => {
    const result = updateSkillAdminSchema.safeParse({
      name: 'TypeScript',
      category: 'language',
      resources: { categories: ['language'] },
    });
    expect(result.success).toBe(true);
  });

  it('validates bulk skill category update', () => {
    const result = bulkUpdateSkillCategorySchema.safeParse({
      skillIds: ['a', 'b'],
      category: 'devops',
    });
    expect(result.success).toBe(true);
  });
});
