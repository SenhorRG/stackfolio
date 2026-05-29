export function profileSkillResourceCategories(skill: {
  category: string;
  categories?: string[];
}): string[] {
  const fromList = skill.categories?.filter(Boolean) ?? [];
  if (fromList.length) return [...new Set(fromList)];
  if (skill.category.trim()) return [skill.category.trim()];
  return [];
}
