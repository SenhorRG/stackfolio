import { isContactOrMetaLine } from './extract-contact-from-text';

const SKILL_CATALOG_PREFIX =
  /^(core stack|programming languages|frontend|backend|mobile|databases|messaging|cloud|devops|observability|testing|architecture|tools|ai\s*&|languages)\s*:/i;

export function cleanSummaryLines(lines: string[]): string[] {
  return lines.filter(
    (line) =>
      !isContactOrMetaLine(line) &&
      !SKILL_CATALOG_PREFIX.test(line) &&
      line !== '|' &&
      line.length > 0,
  );
}
