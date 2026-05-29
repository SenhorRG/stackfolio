import { isContactOrMetaLine } from './extract-contact-from-text';
import { findContactAnchorIndex } from './find-contact-anchor-index';
import { isMetaLabelLine, isProseLine } from './is-prose-or-meta-line';
import {
  findFirstSectionIndex,
  isSectionHeaderLine,
} from './resume-section-headers';

const JOB_TITLE_HINT =
  /\b(engineer|developer|desenvolvedor|analista|architect|arquiteto|manager|gerente|lead|consultant|consultor|designer|specialist|especialista|intern|estagiário|estagiario|devops|full[- ]?stack|backend|frontend|sre|product|dados|data|software|programador|coordenador|diretor|head|cto|ceo)\b/i;

const NAME_LINE_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'.\- ]{1,78}$/;
const BIRTH_DATE_IN_LINE = /nascimento|birth\s*date/i;
const TECHNICAL_PHRASE_RE =
  /\b(compet[eê]ncias|sistemas\s+operacionais|responsive\s+design|saas|kubernetes|mobile|stack:)\b/i;

function buildHeaderSearchRegion(lines: string[]): string[] {
  const anchor = findContactAnchorIndex(lines);
  const sectionEnd = findFirstSectionIndex(lines);

  if (anchor < 0) {
    return lines.slice(0, Math.min(sectionEnd, 25));
  }

  const aroundContact = lines.slice(
    Math.max(0, anchor - 5),
    Math.min(lines.length, anchor + 15),
  );

  if (sectionEnd < anchor || sectionEnd < 15) {
    const top = lines.slice(0, 8);
    return [...new Set([...top, ...aroundContact])];
  }

  return lines.slice(0, Math.min(sectionEnd, anchor + 15));
}

function looksLikeName(line: string): boolean {
  if (line.length < 3 || line.length > 80) return false;
  if (line.endsWith('.')) return false;
  if (isContactOrMetaLine(line) || isSectionHeaderLine(line)) return false;
  if (isProseLine(line) || isMetaLabelLine(line)) return false;
  if (TECHNICAL_PHRASE_RE.test(line)) return false;
  if (/\d{4}/.test(line)) return false;
  if (JOB_TITLE_HINT.test(line) && line.split(/\s+/).length <= 8) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;
  return NAME_LINE_RE.test(line) || /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ\s'.-]{2,}$/.test(line);
}

function looksLikeJobTitle(line: string): boolean {
  if (line.length < 3 || line.length > 120) return false;
  if (line.endsWith('.')) return false;
  const primary = line.split('|')[0].trim();
  if (JOB_TITLE_HINT.test(primary) && line.length <= 120) return true;
  if (/\|/.test(line) && line.length > 40) return false;
  if (isContactOrMetaLine(line) || isSectionHeaderLine(line)) return false;
  if (isMetaLabelLine(line) || isProseLine(line)) return false;
  if (BIRTH_DATE_IN_LINE.test(line) || /:\s*\d{1,2}\/\d{1,2}\/\d{4}/.test(line)) return false;
  if (/\d{4}/.test(line) && !JOB_TITLE_HINT.test(line)) return false;
  return JOB_TITLE_HINT.test(line);
}

export function extractHeaderNameAndTitle(lines: string[]): {
  suggestedProfileName?: string;
  jobTitle?: string;
} {
  const candidates = buildHeaderSearchRegion(lines).filter(
    (line) => !isContactOrMetaLine(line) && !isSectionHeaderLine(line),
  );

  let name: string | undefined;
  let title: string | undefined;

  for (let i = 0; i < candidates.length; i++) {
    const line = candidates[i];
    if (!name && looksLikeName(line)) {
      name = line;
      const next = candidates[i + 1];
      if (next && looksLikeJobTitle(next)) {
        title = next;
      }
      break;
    }
  }

  if (!name) {
    for (const line of candidates) {
      if (looksLikeName(line)) {
        name = line;
        break;
      }
    }
  }

  const titleCandidates = name
    ? (() => {
        const idx = candidates.indexOf(name);
        return idx >= 0 ? candidates.slice(idx + 1, idx + 4) : candidates.slice(0, 5);
      })()
    : candidates.slice(0, 6);

  if (!title) {
    title = titleCandidates.find((l) => looksLikeJobTitle(l));
  }

  return {
    suggestedProfileName: name?.trim(),
    jobTitle: title?.trim(),
  };
}
