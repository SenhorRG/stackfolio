export type SkillResources = {
  categories?: string[];
  relationships?: string[];
  ebooks?: Record<string, string[]>;
  articles?: Record<string, string[]>;
  sites?: string[];
  repositories?: string[];
  officialDocs?: string[];
  officialLinks?: string[];
  links?: string[];
};

export function parseSkillResources(value: unknown): SkillResources {
  if (!value || typeof value !== 'object') return {};
  return value as SkillResources;
}
