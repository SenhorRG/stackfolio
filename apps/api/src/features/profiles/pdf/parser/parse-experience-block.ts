import type { ProfileIdentity } from '@stackfolio/shared';
import { isContactOrMetaLine } from './extract-contact-from-text';

interface ExperienceEntry {
  company: string;
  role?: string;
  period?: string;
  description?: string;
}
import {
  isDateRangeOnlyLine,
  isExperienceJobHeader,
  isPeriodOnlyLine,
} from './is-experience-job-header';
import { isLikelyEducationLine } from './is-likely-education-line';
import { isSkillCatalogLine } from './is-skill-catalog-line';
import {
  isBulletContinuationFragment,
  shouldMergeBulletContinuation,
} from './is-bullet-continuation';
import { looksLikeRoleLine } from './job-title-hint';
import { parseCompanyLocationPeriod } from './parse-company-location-period';
import {
  extractPeriodFromLine,
  isBulletLine,
  stripBullet,
} from './resume-date-patterns';

function parseRoleCompanyLine(line: string): {
  role?: string;
  company?: string;
  period?: string;
} | null {
  const { remainder, period } = extractPeriodFromLine(line);
  const base = remainder || line;

  const atSplit = base.split(/\s+at\s+|\s+@\s+|\s+na\s+|\s+no\s+|\s+em\s+/i);
  if (atSplit.length === 2) {
    return {
      role: atSplit[0]!.trim(),
      company: atSplit[1]!.trim(),
      period,
    };
  }

  const pipeSplit = base.split(/\s*\|\s*/);
  if (pipeSplit.length >= 2) {
    const companyPart = pipeSplit[0]!.trim();
    const periodPart = pipeSplit.slice(1).join(' | ');
    const periodExtracted = extractPeriodFromLine(periodPart);
    return {
      company: companyPart,
      period: periodExtracted.period ?? period,
    };
  }

  const dashSplit = base.split(/\s+[-–—]\s+/);
  if (dashSplit.length >= 2 && dashSplit[0]!.length <= 80 && looksLikeRoleLine(dashSplit[0]!)) {
    return {
      role: dashSplit[0]!.trim(),
      company: dashSplit[1]!.trim(),
      period: period ?? (dashSplit.slice(2).join(' - ').trim() || undefined),
    };
  }

  return null;
}

function pushBullet(bullets: string[], line: string): void {
  const trimmed = line.trim();
  if (!trimmed) return;
  if (shouldMergeBulletContinuation(trimmed, bullets)) {
    bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${trimmed}`;
    return;
  }
  bullets.push(trimmed);
}

export function parseExperienceBlock(lines: string[]): ProfileIdentity['experience'] {
  const items: ExperienceEntry[] = [];
  let current = null as ExperienceEntry | null;
  const bullets: string[] = [];

  const flush = () => {
    if (!current) return;
    if (bullets.length) {
      current.description = bullets.join('\n').slice(0, 4000);
    }
    items.push(current);
    current = null;
    bullets.length = 0;
  };

  const startEntry = (entry: ExperienceEntry) => {
    flush();
    current = entry;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const next = lines[i + 1]?.trim();
    if (!line) continue;
    if (isSkillCatalogLine(line)) continue;
    if (isLikelyEducationLine(line)) continue;
    if (isContactOrMetaLine(line)) continue;
    if (/^idiomas\s*:/i.test(line)) continue;

    if (isBulletLine(line)) {
      pushBullet(bullets, stripBullet(line));
      continue;
    }

    if (next && isDateRangeOnlyLine(next) && line.length >= 3 && line.length <= 120 && !looksLikeRoleLine(line) && !isBulletLine(line)) {
      const { period: dateRange } = extractPeriodFromLine(next);
      startEntry({
        company: line,
        period: dateRange,
      });
      i += 1;
      continue;
    }

    if (isPeriodOnlyLine(line)) {
      const entry = current;
      if (entry) {
        const normalized = line.replace(/^\|+\s*/, '').replace(/^até\s+/i, '');
        const { period: dateRange } = extractPeriodFromLine(normalized);
        if (dateRange) {
          entry.period = entry.period
            ? `${entry.period} – ${dateRange}`
            : dateRange;
        }
      }
      continue;
    }

    const companyPeriod = parseCompanyLocationPeriod(line);
    if (companyPeriod && companyPeriod.period && /\d{4}/.test(companyPeriod.period)) {
      const roleLine = next && looksLikeRoleLine(next) ? next : undefined;
      startEntry({
        company: companyPeriod.company,
        role: roleLine,
        period: companyPeriod.period,
      });
      if (roleLine) i += 1;
      continue;
    }

    if (looksLikeRoleLine(line) && next) {
      const nextPeriod = extractPeriodFromLine(next);
      if (nextPeriod.period && /\d{4}/.test(nextPeriod.period)) {
        if (isDateRangeOnlyLine(next)) {
          continue;
        }
        const roleCompany = parseRoleCompanyLine(line);
        const companyFromNext =
          parseCompanyLocationPeriod(next) ?? parseRoleCompanyLine(next);
        startEntry({
          company: roleCompany?.company ?? companyFromNext?.company ?? next,
          role: roleCompany?.role ?? line,
          period: nextPeriod.period,
        });
        i += 1;
        continue;
      }
      if (isExperienceJobHeader(next)) {
        const companyParsed =
          parseCompanyLocationPeriod(next) ?? parseRoleCompanyLine(next);
        startEntry({
          company: companyParsed?.company ?? next,
          role: line,
          period: companyParsed?.period,
        });
        i += 1;
        continue;
      }
    }

    const third = lines[i + 2]?.trim();
    if (next && looksLikeRoleLine(next) && third) {
      const thirdPeriod = extractPeriodFromLine(third);
      if (thirdPeriod.period && /\d{4}/.test(thirdPeriod.period) && !isExperienceJobHeader(line, next)) {
        startEntry({
          company: line,
          role: next,
          period: thirdPeriod.period,
        });
        i += 2;
        continue;
      }
    }

    if (next && looksLikeRoleLine(next) && isExperienceJobHeader(line)) {
      const companyParsed =
        parseCompanyLocationPeriod(line) ?? parseRoleCompanyLine(line);
      startEntry({
        company: companyParsed?.company ?? line,
        role: next,
        period: companyParsed?.period,
      });
      i += 1;
      continue;
    }

    const inlinePeriod = extractPeriodFromLine(line);
    if (inlinePeriod.period && /\d{4}/.test(inlinePeriod.period) && inlinePeriod.remainder.length >= 3) {
      startEntry({
        company: inlinePeriod.remainder,
        period: inlinePeriod.period,
      });
      continue;
    }

    const entry = current;
    if (entry && !entry.role && looksLikeRoleLine(line) && !isExperienceJobHeader(line, next)) {
      entry.role = line;
      continue;
    }

    if (isExperienceJobHeader(line, next)) {
      const parsed = parseRoleCompanyLine(line);
      const headerCompany = parseCompanyLocationPeriod(line);
      startEntry({
        company: parsed?.company ?? headerCompany?.company ?? line,
        role: parsed?.role,
        period: parsed?.period ?? headerCompany?.period,
      });
      continue;
    }

    if (!current) {
      if (looksLikeRoleLine(line)) continue;
      if (isBulletContinuationFragment(line)) continue;
      continue;
    }

    pushBullet(bullets, line);
  }

  flush();
  return items.slice(0, 15) as ProfileIdentity['experience'];
}
