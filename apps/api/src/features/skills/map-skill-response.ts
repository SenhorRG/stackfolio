import type { Skill } from '@prisma/client';
import { parseSkillResources } from './skill-resources';

export type SkillListItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  urls: Skill['urls'];
  resources: ReturnType<typeof parseSkillResources>;
  categories: string[];
};

export function mapSkillResponse(row: Skill): SkillListItem {
  const resources = parseSkillResources(row.resources);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    urls: row.urls,
    resources,
    categories: resources.categories ?? [],
  };
}
