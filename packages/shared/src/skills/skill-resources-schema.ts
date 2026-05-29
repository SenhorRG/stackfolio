import { z } from 'zod';

const stringArray = z.array(z.string().min(1)).optional();
const stringRecordArray = z.record(z.array(z.string().min(1))).optional();

const skillResourcesShape = {
  categories: stringArray,
  relationships: stringArray,
  ebooks: stringRecordArray,
  articles: stringRecordArray,
  sites: stringArray,
  repositories: stringArray,
  officialDocs: stringArray,
  officialLinks: stringArray,
  links: stringArray,
};

export const skillResourcesSchema = z
  .object(skillResourcesShape)
  .partial()
  .passthrough();

export type SkillResourcesInput = z.infer<typeof skillResourcesSchema>;
