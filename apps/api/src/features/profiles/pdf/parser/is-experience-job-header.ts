import { isContactOrMetaLine } from './extract-contact-from-text';
import { isLikelyEducationLine } from './is-likely-education-line';
import { isSkillCatalogLine } from './is-skill-catalog-line';
import { looksLikeRoleLine } from './job-title-hint';
import { parseCompanyLocationPeriod } from './parse-company-location-period';
import { extractPeriodFromLine, isBulletLine } from './resume-date-patterns';

const NON_JOB_COLON_LINE =
  /^(core stack|programming|frontend|backend|mobile|databases|messaging|cloud|devops|observability|testing|architecture|tools|ai\s*&|design|languages|idiomas|hard skills|process skills|infrastructure|devsecops)\s*:/i;

export function isDateRangeOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  if (/^\d{1,2}\/\d{4}\s+até\b/i.test(trimmed)) return true;
  if (/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)/i.test(trimmed)) {
    return false;
  }
  const { period, remainder } = extractPeriodFromLine(line);
  if (!period || !/\d{4}/.test(period)) return false;
  return remainder.length < 3 || /^até\s+/i.test(remainder);
}

export function isExperienceJobHeader(
  line: string,
  nextLine?: string,
): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isDateRangeOnlyLine(trimmed) && !looksLikeRoleLine(trimmed)) return false;
  if (trimmed.length > 110 && !parseCompanyLocationPeriod(trimmed)) return false;
  if (
    /\b(campaigns|impressions|engagement|branding|visual assets)\b/i.test(trimmed) &&
    !looksLikeRoleLine(trimmed)
  ) {
    return false;
  }
  if (isBulletLine(trimmed)) return false;
  if (isSkillCatalogLine(trimmed)) return false;
  if (isLikelyEducationLine(trimmed)) return false;
  if (isContactOrMetaLine(trimmed)) return false;
  if (NON_JOB_COLON_LINE.test(trimmed)) return false;
  if (/^idiomas\s*:/i.test(trimmed)) return false;

  const companyPeriod = parseCompanyLocationPeriod(trimmed);
  if (companyPeriod?.period && /\d{4}/.test(companyPeriod.period)) {
    return true;
  }

  const { period, remainder } = extractPeriodFromLine(trimmed);
  if (period && /\d{4}/.test(period) && remainder.length >= 3 && remainder.length <= 150) {
    return true;
  }

  if (looksLikeRoleLine(trimmed) && nextLine) {
    const next = nextLine.trim();
    if (parseCompanyLocationPeriod(next)) return true;
    const nextPeriod = extractPeriodFromLine(next);
    if (nextPeriod.period && /\d{4}/.test(nextPeriod.period)) return true;
  }

  return false;
}

export function isPeriodOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  if (/^\|/.test(trimmed)) {
    const { period } = extractPeriodFromLine(trimmed.replace(/^\|+\s*/, ''));
    return Boolean(period);
  }
  if (/^até\s+/i.test(trimmed)) {
    return /\d{4}/.test(trimmed);
  }
  const { period, remainder } = extractPeriodFromLine(trimmed);
  return Boolean(period && remainder.length < 3);
}
