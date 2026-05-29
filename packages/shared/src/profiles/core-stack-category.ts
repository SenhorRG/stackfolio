export const CORE_STACK_CATEGORY = 'Core Stack';

export function isCoreStackCategory(category: string): boolean {
  return category.trim().toLowerCase() === CORE_STACK_CATEGORY.toLowerCase();
}

export function profileHasCoreStackSkills(
  skills: ReadonlyArray<{ highlight?: boolean }>,
): boolean {
  return skills.some((skill) => skill.highlight);
}
