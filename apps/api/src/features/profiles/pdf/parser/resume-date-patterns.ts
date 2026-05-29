const MONTH =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Janeiro|Fevereiro|Março|Marco|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)';

export const DATE_RANGE_END_RE = new RegExp(
  `(?:${MONTH}\\.?\\s*)?\\d{4}\\s*[-–—|]\\s*(?:(?:${MONTH}\\.?\\s*)?\\d{4}|Present|Atual|Atualmente|Current|Hoje|Now)`,
  'i',
);

export const DATE_RANGE_INLINE_RE = new RegExp(
  `\\b(?:${MONTH}\\.?\\s*)?\\d{4}\\s*[-–—]\\s*(?:(?:${MONTH}\\.?\\s*)?\\d{4}|Present|Atual|Atualmente|Current)\\b`,
  'gi',
);

export const YEAR_RANGE_RE =
  /\b(19|20)\d{2}\s*[-–—]\s*((?:19|20)\d{2}|Present|Atual|Atualmente|Current)\b/i;

export const MM_YYYY_RANGE_RE =
  /\b\d{1,2}\/\d{4}\s*[-–—]\s*(?:\d{1,2}\/\d{4}|Present|Atual|Atualmente|Current|Data\s+atual)\b/i;

export const MM_YYYY_TO_PRESENT_PT_RE =
  /\b\d{1,2}\/\d{4}\s+até\s+(?:o\s+momento|a\s+data\s+atual)\b/i;

export const MM_YYYY_ATE_MM_YYYY_RE =
  /\b\d{1,2}\/\d{4}\s+até\s+\d{1,2}\/\d{4}\b/i;

export const PT_MONTH_YEAR_PRESENT_RE = new RegExp(
  `(?:${MONTH})\\s+de\\s+\\d{4}\\s*[-–—]\\s*(?:Present|Atual|Atualmente|Current|(?:${MONTH})\\s+de\\s+\\d{4})`,
  'i',
);

export const PT_ATE_MM_YYYY_RE = /^até\s+\d{1,2}\/\d{4}\s*$/i;

export const TRAILING_MM_YYYY_RE = /\b\d{1,2}\/\d{4}\s*$/;

const PT_MONTH =
  'janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro';

export const PT_MONTH_YEAR_RANGE_RE = new RegExp(
  `\\b(?:${PT_MONTH})\\s+de\\s+\\d{4}\\s*[-–—]\\s*(?:(?:${PT_MONTH})\\s+de\\s+)?(?:\\d{4}|Present|Atual|Atualmente|Current)(?:\\s*\\([^)]+\\))?`,
  'i',
);

export function extractPeriodFromLine(line: string): {
  remainder: string;
  period?: string;
} {
  for (const re of [
    DATE_RANGE_END_RE,
    PT_MONTH_YEAR_RANGE_RE,
    MM_YYYY_TO_PRESENT_PT_RE,
    MM_YYYY_ATE_MM_YYYY_RE,
    MM_YYYY_RANGE_RE,
    PT_MONTH_YEAR_PRESENT_RE,
    PT_ATE_MM_YYYY_RE,
    YEAR_RANGE_RE,
  ]) {
    const match = line.match(re);
    if (match) {
      const period = match[0].trim();
      const remainder = line.replace(match[0], '').replace(/\s*[-–—|]\s*$/, '').trim();
      return { remainder, period };
    }
  }
  const trailing = line.match(TRAILING_MM_YYYY_RE);
  if (trailing) {
    const period = trailing[0].trim();
    const remainder = line.replace(trailing[0], '').trim();
    return { remainder, period };
  }

  return { remainder: line };
}

export function isBulletLine(line: string): boolean {
  return /^[-*•●▪◦]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
}

export function stripBullet(line: string): string {
  return line.replace(/^[-*•●▪◦]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
}
