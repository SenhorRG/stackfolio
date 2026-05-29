import { isValidSkillToken } from './is-valid-skill-token';
import { isSectionHeaderLine } from './resume-section-headers';

const SKILL_LINE_PREFIX =
  /^(skills|technical skills|habilidades|competências|competencias|stack|tecnologias|hard skills|process skills|infrastructure skills|architecture skills|devops skills)\s*:/i;

function splitSkillTokens(block: string): string[] {
  return block
    .split(/[,|•·;]|\n|\s{2,}/)
    .map((s) => s.replace(/^[-*•]\s*/, '').trim())
    .map((s) => s.replace(SKILL_LINE_PREFIX, '').trim())
    .map((s) => s.replace(/\s*\([^)]*\)\s*$/, '').trim())
    .filter((s) => s.length >= 2 && s.length <= 60);
}

export function splitSkillNames(block: string): string[] {
  const raw = splitSkillTokens(block);
  return [...new Set(raw.filter(isValidSkillToken))];
}

/** Extract skills only from dedicated skills-section text (no body-wide scan). */
export function extractSkillsFromSectionText(skillsSectionText: string): string[] {
  if (!skillsSectionText.trim()) return [];
  const found = new Set<string>();
  for (const name of splitSkillNames(skillsSectionText)) {
    found.add(name);
  }
  return [...found].slice(0, 80);
}

export function extractSummaryHeuristic(lines: string[]): string | undefined {
  const paragraphs: string[] = [];
  let buffer: string[] = [];

  for (const line of lines) {
    if (isSectionHeaderLine(line)) break;
    if (line.length < 40) {
      if (buffer.length >= 2) {
        paragraphs.push(buffer.join(' '));
        buffer = [];
      }
      continue;
    }
    buffer.push(line);
  }
  if (buffer.length >= 2) {
    paragraphs.push(buffer.join(' '));
  }

  const best = paragraphs.sort((a, b) => b.length - a.length)[0];
  return best && best.length >= 80 ? best.slice(0, 4000) : undefined;
}
