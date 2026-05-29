const MIN_LENGTH = 2;
const MAX_LENGTH = 48;

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_HASH_SLUG_PATTERN = /^[a-z0-9-]{32,}$/i;
const LABEL_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s._-]*$/u;

export function isValidSkillCategory(raw: string): boolean {
  const cat = raw.trim();
  if (cat.length < MIN_LENGTH || cat.length > MAX_LENGTH) return false;
  if (cat.startsWith('$')) return false;
  if (OBJECT_ID_PATTERN.test(cat)) return false;
  if (UUID_PATTERN.test(cat)) return false;
  if (LONG_HASH_SLUG_PATTERN.test(cat) && !cat.includes(' ')) return false;
  if (!LABEL_PATTERN.test(cat)) return false;
  return true;
}

export function collectUniqueCategories(values: Iterable<string>): string[] {
  const byKey = new Map<string, string>();
  for (const raw of values) {
    const trimmed = raw.trim();
    if (!isValidSkillCategory(trimmed)) continue;
    const key = trimmed.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, trimmed);
      continue;
    }
    if (trimmed === trimmed.toLowerCase() && existing !== existing.toLowerCase()) {
      byKey.set(key, trimmed);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );
}

export function pickPrimaryCategory(categories?: string[]): string {
  for (const raw of categories ?? []) {
    const trimmed = raw.trim();
    if (isValidSkillCategory(trimmed)) return trimmed;
  }
  return 'concept';
}
