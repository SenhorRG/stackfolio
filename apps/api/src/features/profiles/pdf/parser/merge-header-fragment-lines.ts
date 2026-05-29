import { collapseSpacedLetters, isSpacedLetterFragment } from './collapse-spaced-letters';
import { isSectionHeaderLine } from './resume-section-headers';

export function mergeHeaderFragmentLines(lines: string[]): string[] {
  const out: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (!buffer.length) return;
    const combined = buffer.join(' ');
    if (isSectionHeaderLine(combined)) {
      out.push(combined);
    } else {
      for (const part of buffer) out.push(part);
    }
    buffer = [];
  };

  for (const line of lines) {
    const collapsed = collapseSpacedLetters(line);
    const fragment =
      isSpacedLetterFragment(line) ||
      (collapsed.length <= 20 && /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ\s]{1,22}$/.test(collapsed));

    if (fragment) {
      buffer.push(collapsed);
      const candidate = buffer.join(' ');
      if (isSectionHeaderLine(candidate)) {
        out.push(candidate);
        buffer = [];
      }
      continue;
    }

    flush();
    out.push(line);
  }

  flush();
  return out;
}
