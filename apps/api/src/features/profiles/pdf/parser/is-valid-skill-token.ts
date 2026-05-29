const NOISE_TOKEN =
  /^(and|with|using|or|the|in|of|to|for|based|reducing|improving|supporting|including|etc\.{2,3}|advanced|middle|basic|native|proficiency)$/i;

const SENTENCE_FRAGMENT =
  /\b(designed|developed|built|applied|implemented|migrated|optimized|introduced|worked|reducing|improving|supporting|strengthening)\b/i;

export function isValidSkillToken(token: string): boolean {
  const name = token.trim();
  if (name.length < 2 || name.length > 55) return false;
  if (/^r$/i.test(name)) return false;
  if (NOISE_TOKEN.test(name)) return false;
  if (SENTENCE_FRAGMENT.test(name)) return false;
  const words = name.split(/\s+/);
  if (words.length > 6) return false;
  if (words.length >= 4 && !/[,/()]/.test(name)) return false;
  return true;
}
