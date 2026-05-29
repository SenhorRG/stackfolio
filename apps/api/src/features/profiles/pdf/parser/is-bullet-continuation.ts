export function isBulletContinuationFragment(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(e\s|and\s|with\s|using\s|or\s|the\s|in\s|of\s|to\s|na\s|no\s|em\s|de\s|para\s|com\s|aos?\s)/i.test(trimmed)) {
    return true;
  }
  return /^[a-zà-ÿ(]/.test(trimmed);
}

export function shouldMergeBulletContinuation(
  line: string,
  bullets: string[],
): boolean {
  if (!bullets.length) return false;
  const prev = bullets[bullets.length - 1]!.trim();
  if (isBulletContinuationFragment(line)) return true;
  if (!/[.!?]$/.test(prev) && line.length < 140) return true;
  return false;
}
