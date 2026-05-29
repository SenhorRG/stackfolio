import { z } from 'zod';

export const bulkUpdateSkillCategorySchema = z.object({
  skillIds: z.array(z.string().min(1)).min(1).max(500),
  category: z.string().trim().min(1).max(80),
});

export type BulkUpdateSkillCategoryInput = z.infer<
  typeof bulkUpdateSkillCategorySchema
>;
