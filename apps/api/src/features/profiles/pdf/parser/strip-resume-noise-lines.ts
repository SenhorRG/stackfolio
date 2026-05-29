const PAGE_FOOTER_RE = /^page\s+\d+\s+of\s+\d+$/i;
const CREATED_AT_RE = /^created\s+at\s+/i;
const CV_COMPOSE_RE = /cvcompose\.com/i;

export function stripResumeNoiseLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (PAGE_FOOTER_RE.test(trimmed)) return null;
  if (CREATED_AT_RE.test(trimmed) && CV_COMPOSE_RE.test(trimmed)) return null;
  if (CV_COMPOSE_RE.test(trimmed) && trimmed.length < 40) return null;
  return trimmed;
}
