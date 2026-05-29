/**
 * Joins inline skill texts for one comma/list visual line.
 * When the line continues on the next wrapped row, append a trailing comma.
 */
export function joinCommaLineSkillTexts(
  skillTexts: Array<string | null | undefined>,
  options?: { trailingComma?: boolean },
): string {
  const parts = skillTexts
    .map((text) => text?.trim())
    .filter((text): text is string => Boolean(text));
  if (!parts.length) return '';
  const body = parts.join(', ');
  return options?.trailingComma ? `${body},` : body;
}
