import type { SectionKey } from './resume-section-headers';
import { isSectionHeaderLine, mapSectionHeader } from './resume-section-headers';

export function parseResumeSections(lines: string[]): Record<SectionKey, string[]> {
  const buckets: Record<SectionKey, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    certificates: [],
    projects: [],
    languages: [],
  };

  let current: SectionKey | null = null;

  for (const line of lines) {
    if (isSectionHeaderLine(line)) {
      current = mapSectionHeader(line);
      continue;
    }
    if (current) buckets[current].push(line);
  }

  return buckets;
}
