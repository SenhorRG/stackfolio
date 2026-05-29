import type { ProfileIdentity } from '@stackfolio/shared';
import { extractPeriodFromLine } from './resume-date-patterns';

const SKILL_SUBHEADER_RE =
  /^(process\s+skills|hard\s+skills|infraestructure\s+skills|architecture\s+skills|devsecops\s+skills|soft\s+skills|compet[eê]ncias)/i;

export function parseEducationBlock(lines: string[]): ProfileIdentity['education'] {
  const items: ProfileIdentity['education'] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (SKILL_SUBHEADER_RE.test(line)) break;
    if (/^[•●▪-]\s/.test(line) && items.length > 0) break;

    const { remainder, period } = extractPeriodFromLine(line);
    const base = remainder || line;

    const atSplit = base.split(/\s+at\s+|\s+@\s+|\s+na\s+|\s+em\s+/i);
    if (atSplit.length === 2) {
      items.push({
        degree: atSplit[0].trim(),
        institution: atSplit[1].trim(),
        period,
      });
      continue;
    }

    const dashSplit = base.split(/\s+[-–—]\s+/);
    if (dashSplit.length >= 2) {
      items.push({
        institution: dashSplit[0].trim(),
        degree: dashSplit[1].trim(),
        period: period ?? (dashSplit.slice(2).join(' - ').trim() || undefined),
      });
      continue;
    }

    items.push({
      institution: base,
      period,
    });
  }

  return items.slice(0, 10);
}
