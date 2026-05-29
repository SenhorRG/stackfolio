const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /linkedin\.com/i;
const GITHUB_RE = /github\.com/i;

export function findContactAnchorIndex(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const line = lines[i];
    if (
      EMAIL_RE.test(line) ||
      PHONE_RE.test(line) ||
      LINKEDIN_RE.test(line) ||
      GITHUB_RE.test(line)
    ) {
      return i;
    }
  }
  return -1;
}
