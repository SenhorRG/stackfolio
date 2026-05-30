import type { PackingMetrics } from './typography-packing-metrics';
import {
  resolveWrappedTextCharsPerLine,
  type WrappedTextColumn,
} from './estimate-wrapped-text-chars-per-line';

/**
 * Estimates visual line count after wrapping inside the CV content column.
 * Matches nested list bullets and `.item-desc` wrapping in preview.
 */
export function estimateWrappedTextLineCount(
  text: string,
  metrics: PackingMetrics,
  column: WrappedTextColumn = 'nested-list',
): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const charsPerLine = resolveWrappedTextCharsPerLine(metrics, column);
  const paragraphs = trimmed.split(/\n+/).filter(Boolean);
  let lines = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) continue;

    let lineChars = 0;
    let paragraphLines = 1;

    for (const word of words) {
      const addition = lineChars > 0 ? 1 + word.length : word.length;
      if (lineChars > 0 && lineChars + addition > charsPerLine) {
        paragraphLines += 1;
        lineChars = word.length;
      } else {
        lineChars += addition;
      }
    }

    lines += paragraphLines;
  }

  return Math.max(1, lines);
}
