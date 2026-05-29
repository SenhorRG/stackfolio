import { z } from 'zod';
import { RelationType } from '../enums/relation-type';

export const skillRelationSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  relationType: z.nativeEnum(RelationType),
});

export type SkillRelation = z.infer<typeof skillRelationSchema>;

export const createSkillRelationSchema = skillRelationSchema.omit({
  id: true,
});
