export function descriptionToBullets(description?: string): string[] {
  if (!description?.trim()) return [];
  return description
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-*]+\s*/, '').trim())
    .filter(Boolean);
}
