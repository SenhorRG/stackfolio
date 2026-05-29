export function parseSkillResourceCategories(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const categories = (value as { categories?: unknown }).categories;
  if (!Array.isArray(categories)) return [];
  return categories.filter(
    (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
  );
}
