import { extractPeriodFromLine } from './resume-date-patterns';

const COMPANY_LOCATION_PERIOD_RE =
  /^(.+?)\s*\(\s*([^,)]+)\s*,\s*(.+)\)\s*$/;
const COMPANY_COMMA_LOCATION_PERIOD_RE =
  /^(.+?),\s*([^|]+?)\s*\|\s*(.+)$/;

export function parseCompanyLocationPeriod(line: string): {
  company: string;
  location?: string;
  period?: string;
  remainder?: string;
} | null {
  const { remainder, period: inlinePeriod } = extractPeriodFromLine(line);
  const base = remainder || line;

  const paren = base.match(COMPANY_LOCATION_PERIOD_RE);
  if (paren) {
    const innerPeriod = extractPeriodFromLine(paren[3]);
    return {
      company: paren[1].trim(),
      location: paren[2].trim(),
      period: innerPeriod.period ?? inlinePeriod ?? paren[3].trim(),
    };
  }

  const pipe = base.match(COMPANY_COMMA_LOCATION_PERIOD_RE);
  if (pipe) {
    const innerPeriod = extractPeriodFromLine(pipe[3]);
    return {
      company: pipe[1].trim(),
      location: pipe[2].trim(),
      period: innerPeriod.period ?? inlinePeriod ?? pipe[3].trim(),
    };
  }

  return null;
}
