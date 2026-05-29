import { afterEach, describe, expect, it, vi } from 'vitest';
import * as commaCharsPerLine from './estimate-comma-chars-per-line';
import { estimateCommaCharsPerLine } from './estimate-comma-chars-per-line';
import { joinCommaLineSkillTexts } from './join-comma-line-skill-texts';
import { splitCommaCategoryIntoLineBatches } from './split-comma-category-line-batches';
import { resolvePackingMetrics } from './typography-packing-metrics';

function formatSkillInline(skill: { name: string; level?: string }): string {
  const level = skill.level ? ` (${skill.level})` : '';
  return `${skill.name}${level}`;
}

function formatCommaLineBatch(
  group: { label: string; skills: Array<{ name: string; level?: string }> },
  batch: { skillStart: number; skillEnd: number },
  batchIndex: number,
  batchCount: number,
): string {
  const prefix = batchIndex === 0 && group.label ? `${group.label}: ` : '';
  const texts = group.skills
    .slice(batch.skillStart, batch.skillEnd)
    .map((skill) => formatSkillInline(skill));
  return (
    prefix +
    joinCommaLineSkillTexts(texts, {
      trailingComma: batchIndex < batchCount - 1,
    })
  );
}

describe('splitCommaCategoryIntoLineBatches', () => {
  const metrics = resolvePackingMetrics();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses fewer chars per line than the old fixed 120-char heuristic', () => {
    expect(estimateCommaCharsPerLine(metrics)).toBeLessThan(120);
  });

  it('splits long comma categories into multiple line batches', () => {
    const group = {
      key: 'cloud',
      label: 'Cloud & Infrastructure',
      display: 'comma' as const,
      skills: Array.from({ length: 24 }, (_, i) => ({
        name: `Platform Skill ${i}`,
        level: 'senior',
      })),
    };

    const batches = splitCommaCategoryIntoLineBatches(group, metrics);
    expect(batches.length).toBeGreaterThan(1);
    expect(batches[0]?.skillStart).toBe(0);
    expect(batches.at(-1)?.skillEnd).toBe(group.skills.length);
    for (const batch of batches) {
      expect(batch.skillEnd).toBeGreaterThan(batch.skillStart);
    }
  });

  it('splits with trailing comma on wrapped lines when capacity is tight', () => {
    vi.spyOn(commaCharsPerLine, 'estimateCommaCharsPerLine').mockReturnValue(32);

    const group = {
      key: 'backend',
      label: 'Backend',
      display: 'comma' as const,
      skills: [
        { name: 'Node.js' },
        { name: 'TypeScript' },
        { name: 'Python' },
        { name: 'Go' },
      ],
    };

    const batches = splitCommaCategoryIntoLineBatches(group, metrics);
    expect(batches.length).toBeGreaterThan(1);

    const lines = batches.map((batch, index) =>
      formatCommaLineBatch(group, batch, index, batches.length),
    );
    expect(lines[0]).toMatch(/,\s*$/);
    expect(lines[0]).toContain('TypeScript,');
    expect(lines.at(-1)).not.toMatch(/,\s*$/);
  });

  it('keeps short categories on a single batch', () => {
    const group = {
      key: 'backend',
      label: 'Backend',
      display: 'comma' as const,
      skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
    };

    const batches = splitCommaCategoryIntoLineBatches(group, metrics);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual({ skillStart: 0, skillEnd: 2 });
  });
});
