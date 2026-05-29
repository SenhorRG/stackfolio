import {
  emptyProfileIdentity,
  type ParsedProfileFromPdf,
} from '@stackfolio/shared';
import { extractContactFromText, isContactOrMetaLine } from './parser/extract-contact-from-text';
import { extractHeaderNameAndTitle } from './parser/extract-header-name-title';
import {
  extractSkillsFromSectionText,
  extractSummaryHeuristic,
} from './parser/extract-skills-from-text';
import {
  normalizeResumeLines,
} from './parser/normalize-resume-lines';
import { findFirstSectionIndex } from './parser/resume-section-headers';
import { isProseLine } from './parser/is-prose-or-meta-line';
import { isLikelyEducationLine } from './parser/is-likely-education-line';
import { parseEducationBlock } from './parser/parse-education-block';
import { parseExperienceBlock } from './parser/parse-experience-block';
import { cleanSummaryLines } from './parser/clean-summary-lines';
import { parseResumeSections } from './parser/parse-resume-sections';
import { reclassifySectionBuckets } from './parser/reclassify-section-buckets';
import { isMinimalExtraction } from './parser/score-extraction-quality';
import { isSectionHeaderLine } from './parser/resume-section-headers';

export function extractProfileFromResumeText(text: string): ParsedProfileFromPdf {
  const warnings: string[] = [];
  const lines = normalizeResumeLines(text);
  const identity = emptyProfileIdentity();
  const skillNames: string[] = [];

  if (!lines.length) {
    warnings.push('No text could be extracted from the PDF.');
    return { identity, skillNames, warnings };
  }

  const { contact, links } = extractContactFromText(text, lines);
  identity.contact = contact;
  identity.links = links;

  const { suggestedProfileName, jobTitle } = extractHeaderNameAndTitle(lines);
  if (jobTitle) identity.jobTitle = jobTitle;

  const buckets = reclassifySectionBuckets(parseResumeSections(lines));

  const firstSection = findFirstSectionIndex(lines);
  const leadingProse = lines
    .slice(0, firstSection)
    .filter(
      (l) =>
        isProseLine(l) &&
        !isContactOrMetaLine(l) &&
        l !== suggestedProfileName &&
        l !== identity.jobTitle,
    );
  if (leadingProse.length) {
    identity.summary = leadingProse.join('\n').slice(0, 4000);
  }

  if (buckets.summary.length) {
    const cleaned = cleanSummaryLines(buckets.summary);
    if (cleaned.length && !identity.summary?.trim()) {
      identity.summary = cleaned.join('\n').slice(0, 4000);
    }
  }

  if (buckets.experience.length) {
    identity.experience = parseExperienceBlock(buckets.experience);
  }

  if (buckets.education.length) {
    identity.education = parseEducationBlock(buckets.education);
  }

  const skillsSectionText = buckets.skills.join('\n');
  skillNames.push(...extractSkillsFromSectionText(skillsSectionText));

  if (buckets.languages.length) {
    identity.languages = buckets.languages.slice(0, 10).map((line) => {
      const [name, level] = line.split(/\s*[-–—:]\s*/);
      return { name: name.trim(), level: level?.trim() };
    });
  }

  if (buckets.certificates.length) {
    identity.certificates = buckets.certificates.slice(0, 10).map((line) => ({
      name: line,
    }));
  }

  if (buckets.projects.length) {
    identity.projects = buckets.projects.slice(0, 10).map((line) => ({
      name: line.slice(0, 120),
      description: undefined,
    }));
  }

  if (!identity.summary) {
    const preSection = lines.filter(
      (l, i) =>
        i < lines.findIndex((x) => isSectionHeaderLine(x)) &&
        !isContactOrMetaLine(l) &&
        l !== suggestedProfileName &&
        l !== identity.jobTitle,
    );
    const heuristic = extractSummaryHeuristic(preSection);
    if (heuristic) identity.summary = heuristic;
  }

  if (!identity.experience.length) {
    const experienceHints = lines.filter(
      (l) =>
        !isLikelyEducationLine(l) &&
        /\b(19|20)\d{2}\b/.test(l) &&
        (/\b(at|@|na|no|em)\b/i.test(l) || /\s+[-–—]\s+/.test(l)),
    );
    if (experienceHints.length) {
      identity.experience = parseExperienceBlock(experienceHints);
    }
  }

  if (isMinimalExtraction(identity, skillNames.length, suggestedProfileName)) {
    warnings.push(
      'Limited structure detected; only partial fields may have been filled.',
    );
  }

  return {
    identity,
    skillNames,
    warnings,
    suggestedProfileName,
  };
}
