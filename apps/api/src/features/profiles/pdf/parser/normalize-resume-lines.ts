import { collapseSpacedLetters } from './collapse-spaced-letters';
import { mergeHeaderFragmentLines } from './merge-header-fragment-lines';
import { isSectionHeaderLine } from './resume-section-headers';
import { stripResumeNoiseLine } from './strip-resume-noise-lines';

/** Collapse multi-column PDF lines (2+ spaces / tabs) into reading order. */
function unfoldColumnLine(line: string): string[] {
  const parts = line
    .split(/\t|\s{3,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [collapseSpacedLetters(line.trim())];
  return parts.map((p) => collapseSpacedLetters(p));
}

export function normalizeResumeLines(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];
  for (const row of raw) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    for (const part of unfoldColumnLine(trimmed)) {
      const cleaned = stripResumeNoiseLine(part);
      if (cleaned) lines.push(cleaned);
    }
  }
  return mergeHeaderFragmentLines(lines);
}

export function linesBeforeFirstSection(lines: string[]): string[] {
  const end = lines.findIndex((line) => isSectionHeaderLine(line));
  return end === -1 ? lines.slice(0, 30) : lines.slice(0, end).slice(0, 30);
}
