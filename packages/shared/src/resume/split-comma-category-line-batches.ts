import type { SkillInlineFormatOptions } from '../profiles/profile-skill-display-settings';
import {
  formatSkillInline,
  type ResolvedSkillCategoryGroup,
} from './skills-by-category';
import { estimateCommaCharsPerLine } from './estimate-comma-chars-per-line';
import type { PackingMetrics } from './typography-packing-metrics';

export type CommaLineBatch = {
  skillStart: number;
  skillEnd: number;
};

/**
 * Splits a comma/list skill category into one batch per visual text line so
 * pagination can move whole lines to the next page (no mid-glyph clipping).
 */
export function splitCommaCategoryIntoLineBatches(
  group: ResolvedSkillCategoryGroup,
  metrics: PackingMetrics,
  formatOptions?: SkillInlineFormatOptions,
): CommaLineBatch[] {
  const skills = group.skills;
  if (!skills.length) return [];

  const charsPerLine = estimateCommaCharsPerLine(metrics);
  const labelPrefix = group.label ? `${group.label}: ` : '';
  const batches: CommaLineBatch[] = [];
  let skillStart = 0;
  let lineIndex = 0;

  while (skillStart < skills.length) {
    const lineLabelPrefix = lineIndex === 0 ? labelPrefix : '';
    let lineChars = lineLabelPrefix.length;
    let skillEnd = skillStart;

    while (skillEnd < skills.length) {
      const skillText = formatSkillInline(skills[skillEnd]!, formatOptions);
      const separator = skillEnd > skillStart ? ', ' : '';
      const addition = separator + skillText;
      const projected = lineChars + addition.length;

      if (skillEnd > skillStart && projected > charsPerLine) {
        break;
      }

      lineChars = projected;
      skillEnd += 1;

      if (skillEnd < skills.length) {
        const nextText = formatSkillInline(skills[skillEnd]!, formatOptions);
        const withTrailing = lineChars + 1;
        if (withTrailing + ', '.length + nextText.length > charsPerLine) {
          lineChars = withTrailing;
          break;
        }
      }
    }

    batches.push({ skillStart, skillEnd });
    skillStart = skillEnd;
    lineIndex += 1;
  }

  return batches;
}
