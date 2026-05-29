import { z } from 'zod';

export const mergeSkillFieldKeys = [
  'name',
  'slug',
  'category',
  'description',
  'urlOfficial',
  'urlDocs',
  'urlGithub',
  'urlRoadmap',
  'resourceCategories',
  'resources',
] as const;

export const mergeSkillFieldKeySchema = z.enum(mergeSkillFieldKeys);

export type MergeSkillFieldKey = z.infer<typeof mergeSkillFieldKeySchema>;

export const mergeSkillsInputSchema = z
  .object({
    preferredSkillId: z.string().trim().min(1),
    secondarySkillId: z.string().trim().min(1),
    adoptFromSecondary: z.array(mergeSkillFieldKeySchema),
  })
  .strict()
  .refine(
    (value) => value.preferredSkillId !== value.secondarySkillId,
    'Preferred and secondary skills must be different',
  );

export type MergeSkillsInput = z.infer<typeof mergeSkillsInputSchema>;
