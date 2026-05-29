export function normalizeItemBullets(item: Record<string, unknown>): string[] {
  const bullets = (item.bullets as string[] | undefined)?.filter(Boolean) ?? [];
  if (bullets.length) return bullets;
  const description = String(item.description ?? '').trim();
  if (!description) return [];
  return description
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-*]+\s*/, '').trim())
    .filter(Boolean);
}
