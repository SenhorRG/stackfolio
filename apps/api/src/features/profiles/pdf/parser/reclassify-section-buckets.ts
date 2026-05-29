import type { SectionKey } from './resume-section-headers';
import { isContactOrMetaLine } from './extract-contact-from-text';
import { isExperienceJobHeader } from './is-experience-job-header';
import { isLikelyEducationLine } from './is-likely-education-line';
import { isSkillCatalogLine } from './is-skill-catalog-line';
import { looksLikeRoleLine } from './job-title-hint';
import { extractPeriodFromLine } from './resume-date-patterns';

function isExperienceContentLine(line: string, nextLine?: string): boolean {
  if (isContactOrMetaLine(line)) return false;
  if (isSkillCatalogLine(line)) return false;
  if (line.length > 110 && !/\d{4}/.test(line)) return false;
  if (isExperienceJobHeader(line, nextLine)) return true;
  if (looksLikeRoleLine(line) && nextLine && isExperienceJobHeader(nextLine)) {
    return true;
  }
  const { period, remainder } = extractPeriodFromLine(line);
  if (period && /\d{4}/.test(period) && remainder.length >= 3 && line.length <= 120) {
    return true;
  }
  return false;
}

function partitionLines(
  lines: string[],
  target: SectionKey,
): { kept: string[]; moved: string[] } {
  const kept: string[] = [];
  const moved: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const next = lines[i + 1];

    if (target === 'skills' && isSkillCatalogLine(line)) {
      kept.push(line);
      continue;
    }

    if (target === 'skills' && isExperienceContentLine(line, next)) {
      moved.push(line);
      continue;
    }

    if (target === 'summary' && isSkillCatalogLine(line)) {
      moved.push(line);
      continue;
    }

    if (
      (target === 'summary' || target === 'skills') &&
      isExperienceContentLine(line, next)
    ) {
      moved.push(line);
      continue;
    }

    if (target === 'education' && isExperienceContentLine(line, next)) {
      moved.push(line);
      continue;
    }

    if (target === 'education' && isLikelyEducationLine(line)) {
      kept.push(line);
      continue;
    }

  if (target === 'education' && !isLikelyEducationLine(line) && looksLikeRoleLine(line)) {
      moved.push(line);
      continue;
    }

    kept.push(line);
  }

  return { kept, moved };
}

export function reclassifySectionBuckets(
  buckets: Record<SectionKey, string[]>,
): Record<SectionKey, string[]> {
  const summaryToSkills: string[] = [];
  const summaryToExperience: string[] = [];
  const skillsToExperience: string[] = [];
  const educationToExperience: string[] = [];

  const summaryPart = partitionLines(buckets.summary, 'summary');
  buckets.summary = summaryPart.kept;
  for (const line of summaryPart.moved) {
    if (isSkillCatalogLine(line)) summaryToSkills.push(line);
    else summaryToExperience.push(line);
  }

  const skillsPart = partitionLines(buckets.skills, 'skills');
  buckets.skills = skillsPart.kept;
  skillsToExperience.push(...skillsPart.moved);

  const eduPart = partitionLines(buckets.education, 'education');
  buckets.education = eduPart.kept;
  educationToExperience.push(...eduPart.moved);

  buckets.skills.push(...summaryToSkills);
  buckets.experience.unshift(
    ...summaryToExperience,
    ...skillsToExperience,
    ...educationToExperience,
  );

  return buckets;
}
