import { describe, expect, it } from 'vitest';
import type { ResumeSectionIdValue } from '../enums/resume-section';
import { continuationOverrideKey } from './continuation-overrides';
import { buildPrimarySectionPageIndex } from './section-primary-page';
import {
  applyPageOverflow,
  measurePageContentHeight,
  measureSectionRunHeight,
  normalizePageSliceShowHeadings,
  pageSlicesAreNonInterleaved,
} from './page-overflow';
import { renderPagesToEditorPages } from './sync-render-pages';
import { shouldRenderSectionHeadingOnPage } from './should-render-section-heading-on-page';
import { coalesceSlicesForLayout } from './coalesce-slice-batches';
import {
  buildLayoutUnits,
  estimateSkillCategoryHeightPx,
  type SectionRenderSlice,
} from './section-layout-units';
import { estimateCommaCharsPerLine } from './estimate-comma-chars-per-line';
import { resolvePackingMetrics } from './typography-packing-metrics';

describe('estimateSkillCategoryHeightPx', () => {
  it('estimates height from comma line batches for many skills', () => {
    const skills = Array.from({ length: 40 }, (_, i) => ({
      name: `S${i}`,
      level: 'mid',
    }));
    const height = estimateSkillCategoryHeightPx({
      key: 'x',
      label: 'Backend',
      display: 'comma',
      skills,
    });
    expect(height).toBeGreaterThan(0);
  });

  it('comma display creates one layout unit per visual line', () => {
    const metrics = resolvePackingMetrics();
    const group = {
      key: 'cloud',
      label: 'Cloud & Infrastructure',
      display: 'comma' as const,
      skills: Array.from({ length: 20 }, (_, i) => ({
        name: `Skill ${i}`,
        level: 'senior',
      })),
    };
    const units = buildLayoutUnits('skills', { categories: [group] }, metrics);
    expect(units.length).toBeGreaterThan(1);
    expect(units.every((unit) => unit.slice.skillBatchStart != null)).toBe(true);
  });

  it('counts only visual lines for a single-line category (label is inline)', () => {
    const metrics = resolvePackingMetrics();
    const height = estimateSkillCategoryHeightPx(
      {
        key: 'backend',
        label: 'Backend',
        display: 'comma',
        skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
      },
      metrics,
    );
    expect(height).toBe(metrics.baseLinePx);
  });

  it('does not add sectionPartGap between coalesced skill categories', () => {
    const metrics = resolvePackingMetrics();
    const categories = [
      {
        key: 'backend',
        label: 'Backend',
        display: 'comma' as const,
        skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
      },
      {
        key: 'frontend',
        label: 'Frontend',
        display: 'comma' as const,
        skills: [{ name: 'React' }, { name: 'Vue' }],
      },
    ];
    const units = buildLayoutUnits('skills', { categories }, metrics);
    const slices: SectionRenderSlice[] = [
      { ...units[0]!.slice, showHeading: true },
      { ...units[1]!.slice, showHeading: false },
    ];

    const measured = measurePageContentHeight(
      slices,
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );
    const expected =
      metrics.headerHeightPx +
      metrics.sectionTitleHeightPx +
      units[0]!.contentHeightPx +
      units[1]!.contentHeightPx;

    expect(measured).toBe(expected);
  });
});

describe('measurePageContentHeight — coalesced comma skills', () => {
  it('does not add sectionPartGap between comma lines in one coalesced block', () => {
    const metrics = resolvePackingMetrics();
    const group = {
      key: 'backend',
      label: 'Backend',
      display: 'comma' as const,
      skills: Array.from({ length: 24 }, (_, i) => ({
        name: `Skill ${i}`,
        level: 'senior',
      })),
    };
    const units = buildLayoutUnits('skills', { categories: [group] }, metrics);
    const commaUnits = units.filter((unit) => unit.slice.commaLineBatch);
    expect(commaUnits.length).toBeGreaterThan(2);

    const coalescedSlice: SectionRenderSlice = {
      sectionId: 'skills',
      showHeading: true,
      categoryStart: 0,
      categoryEnd: 1,
      commaLineParts: commaUnits.map((unit) => ({
        skillBatchStart: unit.slice.skillBatchStart!,
        skillBatchEnd: unit.slice.skillBatchEnd!,
      })),
    };

    const measured = measurePageContentHeight(
      [coalescedSlice],
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );
    const categoryHeight = estimateSkillCategoryHeightPx(group, metrics);
    const expected =
      metrics.headerHeightPx +
      metrics.sectionTitleHeightPx +
      categoryHeight;

    expect(measured).toBe(expected);
  });
});

function expectAllPagesNonInterleaved(
  pages: ReturnType<typeof applyPageOverflow>,
): void {
  for (const page of pages) {
    expect(pageSlicesAreNonInterleaved(page.slices)).toBe(true);
  }
}

describe('applyPageOverflow', () => {
  const manualPages = [
    {
      id: 'page-1',
      sectionIds: [
        'summary',
        'skills',
        'experience',
      ] as ResumeSectionIdValue[],
    },
  ];

  it('packs skills and experience on one page when comma categories fit', () => {
    const skills = {
      categories: [
        {
          label: 'Backend',
          display: 'comma',
          skills: Array.from({ length: 8 }, (_, i) => ({ name: `T${i}` })),
        },
      ],
    };
    const experience = {
      items: Array.from({ length: 6 }, (_, i) => ({
        company: `Co ${i}`,
        role: 'Dev',
        bullets: ['Did things', 'More things'],
      })),
    };

    const content = new Map([
      ['summary', { text: 'Short summary.' }],
      ['skills', skills],
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      manualPages,
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0]!.slices.some((s) => s.sectionId === 'skills')).toBe(true);
  });

  it('splits experience items across pages instead of moving the whole section', () => {
    const experience = {
      items: Array.from({ length: 20 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two', 'Line three'],
      })),
    };
    const content = new Map([
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const experienceSlices = pages.flatMap((p) =>
      p.slices.filter((s) => s.sectionId === 'experience'),
    );
    expect(experienceSlices.length).toBeGreaterThan(1);
    const withHeading = experienceSlices.filter((s) => s.showHeading);
    expect(withHeading.length).toBe(pages.length);
  });

  it('buildLayoutUnits creates one unit per experience item', () => {
    const units = buildLayoutUnits('experience', {
      items: [{ company: 'A' }, { company: 'B' }],
    });
    expect(units).toHaveLength(2);
    expect(units[0]?.slice.itemStart).toBe(0);
    expect(units[1]?.slice.itemEnd).toBe(2);
  });

  it('keeps a following section on one page when the whole section fits after small skills', () => {
    const content = new Map([
      [
        'skills',
        {
          categories: [
            {
              label: 'Backend',
              display: 'comma',
              skills: [
                { name: 'Node.js' },
                { name: 'TypeScript' },
                { name: 'PostgreSQL' },
              ],
            },
          ],
        },
      ],
      [
        'experience',
        {
          items: [
            { company: 'Acme', role: 'Dev', bullets: ['Shipped features'] },
            { company: 'Beta', role: 'Dev', bullets: ['Maintained APIs'] },
            { company: 'Gamma', role: 'Dev', bullets: ['Led migration'] },
          ],
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages).toHaveLength(1);
    const experienceSlices = pages[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    );
    expect(experienceSlices).toHaveLength(3);
    expect(experienceSlices.every((s) => s.itemEnd! - s.itemStart! === 1)).toBe(
      true,
    );
  });

  it('moves entire experience item to continuation page when entire-subsection override is set', () => {
    const content = new Map([
      [
        'experience',
        {
          items: [
            {
              company: 'Acme',
              role: 'Lead',
              period: '2020 – Present',
              bullets: Array.from({ length: 55 }, (_, i) => `Achievement ${i + 1}`),
            },
          ],
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'page-1', sectionIds: ['experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const page2Id = pages[1]!.id;
    const withOverride = applyPageOverflow(
      [{ id: 'page-1', sectionIds: ['experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
      undefined,
      {
        [continuationOverrideKey(page2Id, 'experience')]: 'entire-subsection',
      },
    );

    const page1Slices = withOverride[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    );
    const page2Slices = withOverride[1]!.slices.filter(
      (s) => s.sectionId === 'experience',
    );
    expect(page1Slices).toHaveLength(0);
    expect(page2Slices).toHaveLength(1);
    expect(page2Slices[0]?.part).toBe('full');
    expect(page2Slices[0]?.itemStart).toBe(0);
  });

  it('splits long experience bullets across pages', () => {
    const content = new Map([
      [
        'experience',
        {
          items: [
            {
              company: 'Acme',
              role: 'Lead',
              period: '2020 – Present',
              bullets: Array.from({ length: 55 }, (_, i) => `Achievement ${i + 1}`),
            },
          ],
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const allSlices = pages.flatMap((p) => p.slices);
    expect(allSlices.some((s) => s.part === 'header')).toBe(true);
    expect(allSlices.some((s) => s.part === 'bullet')).toBe(true);
  });

  it('puts experience on page 1 after short comma skills (no whole-section skip)', () => {
    const content = new Map([
      [
        'skills',
        {
          categories: [
            {
              label: 'Backend',
              display: 'comma',
              skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
            },
          ],
        },
      ],
      [
        'experience',
        {
          items: Array.from({ length: 18 }, (_, i) => ({
            company: `Company ${i}`,
            role: 'Engineer',
            bullets: ['Line one', 'Line two', 'Line three'],
          })),
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const metrics = resolvePackingMetrics();
    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    const page1Exp = pages[0]!.slices.filter((s) => s.sectionId === 'experience');
    expect(page1Exp.length).toBeGreaterThan(5);
    expect(pages[0]!.slices.some((s) => s.sectionId === 'skills')).toBe(true);
    expect(metrics.packableHeightPx).toBeGreaterThan(metrics.headerHeightPx);
  });

  it('starts experience on page 1 and continues on page 2 when it does not fit whole', () => {
    const content = new Map([
      [
        'skills',
        {
          categories: [
            {
              label: 'Backend',
              display: 'comma',
              skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
            },
          ],
        },
      ],
      [
        'experience',
        {
          items: Array.from({ length: 18 }, (_, i) => ({
            company: `Company ${i}`,
            role: 'Engineer',
            bullets: ['Line one', 'Line two', 'Line three'],
          })),
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const page1Exp = pages[0]!.slices.filter((s) => s.sectionId === 'experience');
    const page2Exp = pages[1]!.slices.filter((s) => s.sectionId === 'experience');
    expect(page1Exp.length).toBeGreaterThan(0);
    expect(page2Exp.length).toBeGreaterThan(0);
    expect(pages[0]!.slices.some((s) => s.sectionId === 'skills')).toBe(true);
  });

  it('keeps comma-list skills on the same page when they fit', () => {
    const content = new Map([
      [
        'skills',
        {
          categories: [
            {
              label: 'Backend',
              display: 'comma',
              skills: Array.from({ length: 10 }, (_, i) => ({
                name: `Skill ${i}`,
              })),
            },
          ],
        },
      ],
      [
        'experience',
        {
          items: [
            { company: 'Acme', role: 'Dev', bullets: ['Shipped features'] },
          ],
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages).toHaveLength(1);
    expect(pages[0]!.slices.some((s) => s.sectionId === 'skills')).toBe(true);
    expect(pages[0]!.slices.some((s) => s.sectionId === 'experience')).toBe(
      true,
    );
  });

  it('does not place experience slices on page 1 when manual primary is page 2', () => {
    const fillerSkills = {
      categories: Array.from({ length: 8 }, (_, categoryIndex) => ({
        label: `Category ${categoryIndex}`,
        display: 'comma',
        skills: Array.from({ length: 12 }, (_, skillIndex) => ({
          name: `Skill ${categoryIndex}-${skillIndex}`,
        })),
      })),
    };
    const experienceItems = Array.from({ length: 12 }, (_, index) => ({
      company: `Company ${index}`,
      role: 'Engineer',
      bullets: ['Line one', 'Line two', 'Line three'],
    }));
    const manualPages = [
      {
        id: 'page-1',
        sectionIds: ['skills'] as ResumeSectionIdValue[],
        continuationSectionIds: ['experience'] as ResumeSectionIdValue[],
      },
      {
        id: 'page-2',
        sectionIds: ['experience'] as ResumeSectionIdValue[],
      },
    ];
    const content = new Map([
      ['skills', fillerSkills],
      ['experience', { items: experienceItems }],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(manualPages, {}, content);

    const primaryBySection = buildPrimarySectionPageIndex(manualPages);
    expect(primaryBySection.get('experience')).toBe(1);
    expect(
      pages[0]!.slices.some((slice) => slice.sectionId === 'experience'),
    ).toBe(false);
    expect(
      pages[1]!.slices.some((slice) => slice.sectionId === 'experience'),
    ).toBe(true);
  });

  it('preserves continued section head on primary page after content grows', () => {
    const fillerSkills = {
      categories: Array.from({ length: 8 }, (_, categoryIndex) => ({
        label: `Category ${categoryIndex}`,
        display: 'comma',
        skills: Array.from({ length: 12 }, (_, skillIndex) => ({
          name: `Skill ${categoryIndex}-${skillIndex}`,
        })),
      })),
    };
    const experienceItems = Array.from({ length: 12 }, (_, index) => ({
      company: `Company ${index}`,
      role: 'Engineer',
      bullets: ['Line one', 'Line two', 'Line three'],
    }));
    const syncedManualPages = [
      { id: 'page-1', sectionIds: ['skills', 'experience'] as ResumeSectionIdValue[] },
      {
        id: 'page-2',
        sectionIds: [] as ResumeSectionIdValue[],
        continuationSectionIds: ['experience'] as ResumeSectionIdValue[],
      },
    ];
    const updatedExperience = {
      items: experienceItems.map((item, index) =>
        index === 0
          ? {
              ...item,
              bullets: Array.from(
                { length: 40 },
                (_, bulletIndex) => `Achievement ${bulletIndex + 1}`,
              ),
            }
          : item,
      ),
    };
    const updatedContent = new Map([
      ['skills', fillerSkills],
      ['experience', updatedExperience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      syncedManualPages,
      {},
      updatedContent as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const page1Experience = pages[0]!.slices.filter(
      (slice) => slice.sectionId === 'experience',
    );
    const page2Experience = pages[1]!.slices.filter(
      (slice) => slice.sectionId === 'experience',
    );
    expect(page1Experience.length).toBeGreaterThan(0);
    expect(page2Experience.length).toBeGreaterThan(0);
  });

  it('packs custom skill items without a categories field using category batches', () => {
    const customSkills = {
      display: 'comma',
      items: Array.from({ length: 14 }, (_, i) => ({
        name: `Skill ${i}`,
        categories: i < 7 ? ['backend'] : ['frontend'],
      })),
    };
    const experience = {
      items: [
        { company: 'Acme', role: 'Dev', bullets: ['Shipped features'] },
      ],
    };
    const content = new Map([
      ['skills', customSkills],
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const units = buildLayoutUnits(
      'skills',
      customSkills as Record<string, unknown>,
    );
    expect(units.length).toBeGreaterThanOrEqual(2);
    expect(units.some((unit) => unit.slice.categoryStart != null)).toBe(true);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0]!.slices.some((s) => s.sectionId === 'experience')).toBe(
      true,
    );
  });

  it('splits list-mode skill lines across pages instead of clipping at page bottom', () => {
    const metrics = resolvePackingMetrics();
    const itemHeightPx =
      metrics.listItemHeaderHeightPx + metrics.bulletLineHeightPx;
    const fillerCount = Math.max(
      1,
      Math.floor(
        (metrics.packableHeightPx - metrics.sectionTitleHeightPx) / itemHeightPx,
      ) - 1,
    );
    const experience = {
      items: Array.from({ length: fillerCount }, (_, i) => ({
        company: `Co ${i}`,
        role: 'Dev',
        bullets: ['One line only'],
      })),
    };
    const skills = {
      display: 'list',
      categories: [
        {
          label: 'Cloud & Infrastructure',
          display: 'comma',
          skills: Array.from({ length: 18 }, (_, i) => ({
            name: `Platform ${i}`,
            level: 'senior',
          })),
        },
      ],
    };
    const content = new Map([
      ['experience', experience],
      ['skills', skills],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['experience', 'skills'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const page1Skills = pages[0]!.slices.filter((s) => s.sectionId === 'skills');
    const page2Skills = pages[1]!.slices.filter((s) => s.sectionId === 'skills');
    expect(page1Skills.length + page2Skills.length).toBeGreaterThan(1);
  });

  it('reserves section title height on continuation pages', () => {
    const experience = {
      items: Array.from({ length: 24 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two', 'Line three'],
      })),
    };
    const content = new Map([
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const page2First = pages[1]!.slices.find((s) => s.sectionId === 'experience');
    expect(page2First?.showHeading).toBe(true);
  });

  it('splits comma skill categories into line-level layout units', () => {
    const longNames = Array.from({ length: 24 }, (_, i) => ({
      name: `Skill With A Long Name ${i}`,
    }));
    const units = buildLayoutUnits('skills', {
      categories: [
        {
          label: 'Backend',
          display: 'comma',
          skills: longNames,
        },
      ],
    });
    expect(units.length).toBeGreaterThan(1);
    expect(units.every((unit) => unit.slice.categoryStart === 0)).toBe(true);
    expect(
      units.every(
        (unit) =>
          unit.slice.skillBatchStart != null &&
          unit.slice.skillBatchEnd != null &&
          unit.slice.skillBatchEnd! > unit.slice.skillBatchStart!,
      ),
    ).toBe(true);
  });

  it('packs experience on page 1 when comma skill lines leave enough room', () => {
    const content = new Map([
      [
        'skills',
        {
          categories: [
            {
              label: 'Backend',
              display: 'comma',
              skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
            },
          ],
        },
      ],
      [
        'experience',
        {
          items: Array.from({ length: 8 }, (_, i) => ({
            company: `Company ${i}`,
            role: 'Engineer',
            bullets: ['Line one', 'Line two'],
          })),
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages[0]!.slices.some((s) => s.sectionId === 'experience')).toBe(
      true,
    );
  });

  it('packs following sections on the skills page when many single-line categories fit', () => {
    const metrics = resolvePackingMetrics();
    const categories = Array.from({ length: 14 }, (_, categoryIndex) => ({
      label: `Category ${categoryIndex}`,
      display: 'comma' as const,
      skills: [{ name: 'Skill A' }, { name: 'Skill B' }],
    }));
    const experienceItems = Array.from({ length: 6 }, (_, index) => ({
      company: `Company ${index}`,
      role: 'Engineer',
      bullets: ['Shipped features'],
    }));
    const content = new Map([
      ['skills', { categories }],
      ['experience', { items: experienceItems }],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    const skillsUnits = buildLayoutUnits(
      'skills',
      { categories },
      metrics,
    );
    const skillsHeight = measureSectionRunHeight(
      skillsUnits,
      false,
      metrics,
      false,
    );
    const experienceUnits = buildLayoutUnits(
      'experience',
      { items: experienceItems },
      metrics,
    );
    const experienceHeight = measureSectionRunHeight(
      experienceUnits,
      true,
      metrics,
      false,
    );
    const totalNeeded =
      metrics.headerHeightPx +
      skillsHeight +
      metrics.sectionGapPx +
      experienceHeight;

    expect(totalNeeded).toBeLessThanOrEqual(metrics.packableHeightPx);
    expect(pages).toHaveLength(1);
    expect(pages[0]!.slices.some((s) => s.sectionId === 'experience')).toBe(
      true,
    );
  });

  it('assigns page ids for every packed page after manual-primary relocate', () => {
    const manualPages = [
      { id: 'page-1', sectionIds: [] as ResumeSectionIdValue[] },
      { id: 'page-2', sectionIds: [] as ResumeSectionIdValue[] },
      {
        id: 'page-3',
        sectionIds: ['skills'] as ResumeSectionIdValue[],
      },
    ];
    const content = new Map([
      [
        'skills',
        {
          categories: [
            {
              label: 'Backend',
              display: 'comma',
              skills: [{ name: 'TypeScript' }, { name: 'Node.js' }],
            },
          ],
        },
      ],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(manualPages, {}, content);

    expect(pages.length).toBeGreaterThanOrEqual(3);
    for (const page of pages) {
      expect(typeof page.id).toBe('string');
      expect(page.id.length).toBeGreaterThan(0);
    }
  });

  it('never interleaves slices from different sections on the same page', () => {
    const skills = {
      categories: Array.from({ length: 8 }, (_, ci) => ({
        label: `Category ${ci}`,
        display: 'tags' as const,
        skills: Array.from({ length: 14 }, (_, i) => ({
          name: `Skill ${ci}-${i}`,
        })),
      })),
    };
    const experience = {
      items: Array.from({ length: 16 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two', 'Line three'],
      })),
    };
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    expectAllPagesNonInterleaved(pages);
    for (const page of pages) {
      const sectionIds = page.slices.map((slice) => slice.sectionId);
      const uniqueInOrder: ResumeSectionIdValue[] = [];
      for (const id of sectionIds) {
        if (uniqueInOrder[uniqueInOrder.length - 1] !== id) {
          uniqueInOrder.push(id);
        }
      }
      expect(uniqueInOrder).toEqual(
        [...new Set(uniqueInOrder)].filter((id) =>
          sectionIds.includes(id),
        ),
      );
    }
  });

  it('does not interleave section blocks on pages with multiple continued sections', () => {
    const skills = {
      categories: Array.from({ length: 6 }, (_, ci) => ({
        label: `Category ${ci}`,
        display: 'comma' as const,
        skills: Array.from({ length: 16 }, (_, i) => ({
          name: `Skill ${ci}-${i}`,
        })),
      })),
    };
    const experience = {
      items: Array.from({ length: 10 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two'],
      })),
    };
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [
        { id: 'page-1', sectionIds: ['skills', 'experience'] },
        {
          id: 'page-2',
          sectionIds: [],
          continuationSectionIds: ['skills', 'experience'] as ResumeSectionIdValue[],
        },
      ],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    expectAllPagesNonInterleaved(pages);
    for (const page of pages) {
      for (const slice of page.slices) {
        if (slice.sectionId === 'experience' && slice.part === 'bullet') {
          expect(slice.bulletIndex).toBeTypeOf('number');
        }
      }
    }
  });

  it('stacks skills continuation before experience on page 2 in slice order', () => {
    const skills = {
      categories: Array.from({ length: 10 }, (_, ci) => ({
        label: `Category ${ci}`,
        display: 'comma' as const,
        skills: Array.from({ length: 14 }, (_, i) => ({
          name: `Skill ${ci}-${i}`,
        })),
      })),
    };
    const experience = {
      items: Array.from({ length: 12 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two', 'Line three'],
      })),
    };
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const page2 = pages[1]!.slices;
    const skillIndices = page2
      .map((slice, index) => (slice.sectionId === 'skills' ? index : -1))
      .filter((index) => index >= 0);
    const firstExperience = page2.findIndex(
      (slice) => slice.sectionId === 'experience',
    );
    if (skillIndices.length > 0 && firstExperience >= 0) {
      expect(Math.max(...skillIndices)).toBeLessThan(firstExperience);
    }
  });

  it('packs following sections on the same page when the next skill line does not fit', () => {
    const metrics = resolvePackingMetrics();
    const skills = {
      categories: [
        {
          label: 'Backend',
          display: 'comma' as const,
          skills: Array.from({ length: 30 }, (_, i) => ({
            name: `Skill With A Descriptive Name ${i}`,
          })),
        },
      ],
    };
    const experience = {
      items: Array.from({ length: 4 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one'],
      })),
    };
    const education = {
      items: [{ institution: 'University', degree: 'BS' }],
    };
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
      ['education', education],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const units = [
      ...buildLayoutUnits('skills', skills, metrics),
      ...buildLayoutUnits('experience', experience, metrics),
      ...buildLayoutUnits('education', education, metrics),
    ];

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience', 'education'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    const page1 = pages[0]!;
    const page1Skills = page1.slices.filter((s) => s.sectionId === 'skills');
    const page1Experience = page1.slices.filter(
      (s) => s.sectionId === 'experience',
    );
    const page1Education = page1.slices.filter(
      (s) => s.sectionId === 'education',
    );

    expect(page1Skills.length).toBeGreaterThan(0);
    expect(page1Experience.length).toBeGreaterThan(0);
    expect(page1Experience[0]?.showHeading).toBe(true);

    const coalesced = coalesceSlicesForLayout(page1.slices);
    let lastSectionOnPage: ResumeSectionIdValue | null = null;
    for (const slice of coalesced) {
      const isFirstOnPage = slice.sectionId !== lastSectionOnPage;
      if (slice.sectionId === 'experience') {
        expect(shouldRenderSectionHeadingOnPage(slice, isFirstOnPage)).toBe(
          true,
        );
        break;
      }
      lastSectionOnPage = slice.sectionId;
    }

    const page1Used = measurePageContentHeight(
      page1.slices,
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );
    expect(page1Used).toBeGreaterThan(metrics.packableHeightPx * 0.7);

    if (page1Education.length > 0) {
      expect(page1Education[0]?.showHeading).toBe(true);
    }
  });

  it('fills page 1 before starting experience on page 2 when skills leave a small gap', () => {
    const metrics = resolvePackingMetrics();
    const skills = {
      categories: Array.from({ length: 6 }, (_, ci) => ({
        label: `Category ${ci}`,
        display: 'comma' as const,
        skills: Array.from({ length: 14 }, (_, i) => ({
          name: `Skill ${ci}-${i}`,
        })),
      })),
    };
    const experience = {
      items: Array.from({ length: 12 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two'],
      })),
    };
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const units = [
      ...buildLayoutUnits('skills', skills, metrics),
      ...buildLayoutUnits('experience', experience, metrics),
    ];

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    expect(pages.length).toBeGreaterThan(1);
    const page1Slices = pages[0]!.slices;
    const page1Used = measurePageContentHeight(
      page1Slices,
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );
    const page1Experience = page1Slices.filter(
      (slice) => slice.sectionId === 'experience',
    );
    expect(page1Experience.length).toBeGreaterThan(0);
    expect(page1Used).toBeGreaterThan(metrics.packableHeightPx * 0.82);
  });

  it('does not mark trailing sections as continuation when they start on the skills page', () => {
    const metrics = resolvePackingMetrics();
    const skills = {
      categories: [
        ...Array.from({ length: 3 }, (_, categoryIndex) => ({
          label: `Category ${categoryIndex}`,
          display: 'comma' as const,
          skills: Array.from({ length: 20 }, (_, skillIndex) => ({
            name: `Skill With Descriptive Name ${categoryIndex}-${skillIndex}`,
          })),
        })),
        {
          label: 'Compact',
          display: 'comma' as const,
          skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
        },
      ],
    };
    const experience = {
      items: Array.from({ length: 2 }, (_, index) => ({
        company: `Company ${index}`,
        role: 'Engineer',
        bullets: ['Line one'],
      })),
    };
    const education = {
      items: [{ institution: 'University', degree: 'BS Computer Science' }],
    };
    const projects = {
      items: [{ name: 'Portfolio App', description: 'Full-stack project' }],
    };
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
      ['education', education],
      ['projects', projects],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);
    const manualPages = [
      {
        id: 'page-1',
        sectionIds: [
          'skills',
          'experience',
          'education',
          'projects',
        ] as ResumeSectionIdValue[],
      },
    ];

    const units = [
      ...buildLayoutUnits('skills', skills, metrics),
      ...buildLayoutUnits('experience', experience, metrics),
      ...buildLayoutUnits('education', education, metrics),
      ...buildLayoutUnits('projects', projects, metrics),
    ];

    const pages = applyPageOverflow(manualPages, {}, content);
    const page1 = pages[0]!;
    const trailingSections = ['experience', 'education', 'projects'] as const;

    for (const sectionId of trailingSections) {
      const sectionSlices = page1.slices.filter(
        (slice) => slice.sectionId === sectionId,
      );
      if (!sectionSlices.length) continue;

      expect(
        sectionSlices[0]?.showHeading,
        `${sectionId} first slice on page 1 must not be a cross-page continuation`,
      ).toBe(true);

      const coalesced = coalesceSlicesForLayout(page1.slices);
      let lastSectionOnPage: ResumeSectionIdValue | null = null;
      for (const slice of coalesced) {
        const isFirstOnPage = slice.sectionId !== lastSectionOnPage;
        if (slice.sectionId === sectionId) {
          expect(
            shouldRenderSectionHeadingOnPage(slice, isFirstOnPage),
            `${sectionId} must render section heading when starting on page 1`,
          ).toBe(true);
          break;
        }
        lastSectionOnPage = slice.sectionId;
      }
    }

    const page1Used = measurePageContentHeight(
      page1.slices,
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );
    expect(page1Used).toBeGreaterThan(metrics.packableHeightPx * 0.75);
  });

  it('does not flag trailing sections as editor continuations on the skills page', () => {
    const skills = {
      categories: Array.from({ length: 4 }, (_, categoryIndex) => ({
        label: `Category ${categoryIndex}`,
        display: 'comma' as const,
        skills: Array.from({ length: 16 }, (_, skillIndex) => ({
          name: `Skill ${categoryIndex}-${skillIndex} with extra words`,
        })),
      })),
    };
    const experience = {
      items: Array.from({ length: 2 }, (_, index) => ({
        company: `Company ${index}`,
        role: 'Engineer',
        bullets: ['Line one'],
      })),
    };
    const education = {
      items: [{ institution: 'University', degree: 'BS' }],
    };
    const projects = {
      items: [{ name: 'App', description: 'Desc' }],
    };
    const sectionOrder = [
      'header',
      'skills',
      'experience',
      'education',
      'projects',
    ] as ResumeSectionIdValue[];
    const manualPages = [
      {
        id: 'page-1',
        sectionIds: [
          'skills',
          'experience',
          'education',
          'projects',
        ] as ResumeSectionIdValue[],
      },
    ];
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
      ['education', education],
      ['projects', projects],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const renderPages = applyPageOverflow(manualPages, {}, content);
    const editorPages = renderPagesToEditorPages(
      renderPages,
      manualPages,
      sectionOrder,
    );

    const page1Render = renderPages[0]!;
    const page1Editor = editorPages[0]!;
    const trailingOnPage1 = ['experience', 'education', 'projects'] as const;

    for (const sectionId of trailingOnPage1) {
      const onPage1 = page1Render.slices.some(
        (slice) => slice.sectionId === sectionId,
      );
      if (!onPage1) continue;
      expect(
        page1Editor.continuationSectionIds ?? [],
        `${sectionId} starts on page 1 and must not be a continuation row`,
      ).not.toContain(sectionId);
    }
  });

  it('fills page 1 with experience when many skill categories share the manual page', () => {
    const metrics = resolvePackingMetrics();
    const skills = {
      categories: [
        ...Array.from({ length: 4 }, (_, categoryIndex) => ({
          label: `Category ${categoryIndex}`,
          display: 'comma' as const,
          skills: Array.from({ length: 14 }, (_, skillIndex) => ({
            name: `Skill With Descriptive Name ${categoryIndex}-${skillIndex}`,
          })),
        })),
        ...Array.from({ length: 4 }, (_, categoryIndex) => ({
          label: `Other ${categoryIndex}`,
          display: 'comma' as const,
          skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
        })),
      ],
    };
    const experience = {
      items: Array.from({ length: 10 }, (_, index) => ({
        company: `Company ${index}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two'],
      })),
    };
    const content = new Map([
      ['skills', skills],
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);

    const units = [
      ...buildLayoutUnits('skills', skills, metrics),
      ...buildLayoutUnits('experience', experience, metrics),
    ];

    const pages = applyPageOverflow(
      [{ id: 'p1', sectionIds: ['skills', 'experience'] }],
      {},
      content as Map<ResumeSectionIdValue, Record<string, unknown>>,
    );

    const page1 = pages[0]!;
    const page1Experience = page1.slices.filter(
      (slice) => slice.sectionId === 'experience',
    );
    const page1Used = measurePageContentHeight(
      page1.slices,
      true,
      metrics.headerHeightPx,
      units,
      metrics,
    );

    expect(page1Experience.length).toBeGreaterThanOrEqual(2);
    expect(page1Experience[0]?.showHeading).toBe(true);
    expect(page1Used).toBeGreaterThan(metrics.packableHeightPx * 0.82);
    expectAllPagesNonInterleaved(pages);
  });

  it('packs compact and relaxed pages densely with different slice counts', () => {
    const experience = {
      items: Array.from({ length: 14 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two'],
      })),
    };
    const content = new Map([
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);
    const manual = [{ id: 'p1', sectionIds: ['experience'] as ResumeSectionIdValue[] }];
    const compactTheme = {
      fontSize: '10pt',
      lineHeight: '12pt',
      sectionGap: '8pt',
    };
    const relaxedTheme = {
      fontSize: '12pt',
      lineHeight: '18pt',
      sectionGap: '16pt',
    };

    const assertDensePages = (theme: typeof compactTheme) => {
      const metrics = resolvePackingMetrics(theme);
      const units = buildLayoutUnits('experience', experience, metrics);
      const pages = applyPageOverflow(manual, {}, content, theme);
      expect(pages.length).toBeGreaterThan(1);
      for (let pageIndex = 0; pageIndex < pages.length - 1; pageIndex++) {
        const slices = pages[pageIndex]!.slices;
        const used = measurePageContentHeight(
          slices,
          pageIndex === 0,
          metrics.headerHeightPx,
          units,
          metrics,
        );
        expect(used / metrics.packableHeightPx).toBeGreaterThan(0.82);
      }
      return pages;
    };

    const compactPages = assertDensePages(compactTheme);
    const relaxedPages = assertDensePages(relaxedTheme);

    const compactPage1 = compactPages[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    ).length;
    const relaxedPage1 = relaxedPages[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    ).length;
    expect(compactPage1).toBeGreaterThan(relaxedPage1);
    expect(relaxedPages.length).toBeGreaterThanOrEqual(compactPages.length);
  });

  it('relaxed typography yields more pages than compact for the same content', () => {
    const experience = {
      items: Array.from({ length: 14 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two'],
      })),
    };
    const content = new Map([
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);
    const manual = [{ id: 'p1', sectionIds: ['experience'] as ResumeSectionIdValue[] }];

    const compact = applyPageOverflow(manual, {}, content, {
      fontSize: '10pt',
      lineHeight: '12pt',
      sectionGap: '8pt',
    });
    const relaxed = applyPageOverflow(manual, {}, content, {
      fontSize: '12pt',
      lineHeight: '18pt',
      sectionGap: '16pt',
    });

    expect(relaxed.length).toBeGreaterThanOrEqual(compact.length);
    if (compact.length === 1) {
      expect(relaxed.length).toBeGreaterThan(1);
    }
  });
});

describe('normalizePageSliceShowHeadings', () => {
  it('keeps showHeading true for sections that start on the page after partial skills', () => {
    const priorPages: SectionRenderSlice[][] = [];
    const slices: SectionRenderSlice[] = [
      {
        sectionId: 'skills',
        showHeading: true,
        categoryStart: 0,
        categoryEnd: 1,
        commaLineBatch: true,
        skillBatchStart: 0,
        skillBatchEnd: 4,
      },
      {
        sectionId: 'experience',
        showHeading: false,
        itemStart: 0,
        itemEnd: 1,
        part: 'full',
      },
      {
        sectionId: 'education',
        showHeading: false,
        itemStart: 0,
        itemEnd: 1,
        part: 'full',
      },
    ];

    const normalized = normalizePageSliceShowHeadings(priorPages, slices);
    expect(normalized[1]?.showHeading).toBe(true);
    expect(normalized[2]?.showHeading).toBe(true);
  });
});

describe('measureSectionRunHeight', () => {
  it('omits section title when section continues from a prior page', () => {
    const metrics = resolvePackingMetrics();
    const units = buildLayoutUnits('experience', {
      items: [{ company: 'Acme', bullets: ['One'] }],
    });
    const withTitle = measureSectionRunHeight(units, false, metrics, false);
    const continued = measureSectionRunHeight(units, false, metrics, true);
    expect(continued).toBeLessThan(withTitle);
    expect(withTitle - continued).toBe(metrics.sectionTitleHeightPx);
  });
});

describe('typography and comma packing', () => {
  it('fits more characters per comma line when typography is compact', () => {
    const compact = resolvePackingMetrics({
      fontSize: '10pt',
      lineHeight: '12pt',
      sectionGap: '8pt',
    });
    const relaxed = resolvePackingMetrics({
      fontSize: '12pt',
      lineHeight: '18pt',
      sectionGap: '16pt',
    });

    expect(estimateCommaCharsPerLine(compact)).toBeGreaterThan(
      estimateCommaCharsPerLine(relaxed),
    );
  });

  it('uses fewer comma line units for the same skills when typography is compact', () => {
    const skills = Array.from({ length: 22 }, (_, i) => ({
      name: `Skill With A Descriptive Name ${i}`,
      level: 'senior',
    }));
    const content = {
      categories: [
        {
          label: 'Backend',
          display: 'comma' as const,
          skills,
        },
      ],
    };
    const compactUnits = buildLayoutUnits(
      'skills',
      content,
      resolvePackingMetrics({
        fontSize: '10pt',
        lineHeight: '12pt',
        sectionGap: '8pt',
      }),
    );
    const relaxedUnits = buildLayoutUnits(
      'skills',
      content,
      resolvePackingMetrics({
        fontSize: '12pt',
        lineHeight: '18pt',
        sectionGap: '16pt',
      }),
    );

    expect(compactUnits.length).toBeLessThan(relaxedUnits.length);
    expect(compactUnits.every((u) => u.slice.commaLineBatch)).toBe(true);
  });

  it('packs fewer experience slices on page one when typography is relaxed', () => {
    const experience = {
      items: Array.from({ length: 16 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two'],
      })),
    };
    const content = new Map([
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);
    const manual = [
      { id: 'p1', sectionIds: ['experience'] as ResumeSectionIdValue[] },
    ];

    const compactPages = applyPageOverflow(manual, {}, content, {
      fontSize: '10pt',
      lineHeight: '12pt',
      sectionGap: '8pt',
    });
    const relaxedPages = applyPageOverflow(manual, {}, content, {
      fontSize: '12pt',
      lineHeight: '18pt',
      sectionGap: '16pt',
    });

    const compactPage1 = compactPages[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    ).length;
    const relaxedPage1 = relaxedPages[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    ).length;

    expect(relaxedPage1).toBeLessThanOrEqual(compactPage1);
    expect(relaxedPages.length).toBeGreaterThanOrEqual(compactPages.length);
  });
});

describe('pageMetricsTuning', () => {
  it('packs fewer units when packable height override is reduced', () => {
    const experience = {
      items: Array.from({ length: 12 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        bullets: ['Line one', 'Line two'],
      })),
    };
    const content = new Map([
      ['experience', experience],
    ] as [ResumeSectionIdValue, Record<string, unknown>][]);
    const manual = [
      { id: 'p1', sectionIds: ['experience'] as ResumeSectionIdValue[] },
    ];

    const defaultPages = applyPageOverflow(manual, {}, content);
    const tightPages = applyPageOverflow(manual, {}, content, undefined, undefined, {
      packableHeightPx: 420,
    });

    const defaultPage1 = defaultPages[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    ).length;
    const tightPage1 = tightPages[0]!.slices.filter(
      (s) => s.sectionId === 'experience',
    ).length;

    expect(tightPage1).toBeLessThan(defaultPage1);
    expect(tightPages.length).toBeGreaterThanOrEqual(defaultPages.length);
  });

  it('applies charsPerLine tuning to packing metrics', () => {
    const defaultMetrics = resolvePackingMetrics();
    const tuned = resolvePackingMetrics(undefined, { charsPerLine: 42 });
    expect(tuned.charsPerLine).toBe(42);
    expect(estimateCommaCharsPerLine(tuned)).toBe(42);
    expect(estimateCommaCharsPerLine(defaultMetrics)).not.toBe(42);
  });
});

describe('resolvePackingMetrics', () => {
  it('scales line and gap from theme pt units', () => {
    const compact = resolvePackingMetrics({
      fontSize: '10pt',
      lineHeight: '12pt',
      sectionGap: '8pt',
    });
    const relaxed = resolvePackingMetrics({
      fontSize: '12pt',
      lineHeight: '18pt',
      sectionGap: '16pt',
    });

    expect(relaxed.baseLinePx).toBeGreaterThan(compact.baseLinePx);
    expect(relaxed.sectionGapPx).toBeGreaterThan(compact.sectionGapPx);
    expect(relaxed.sectionPartGapPx).toBeGreaterThan(compact.sectionPartGapPx);
    expect(relaxed.packableHeightPx).toBe(compact.packableHeightPx);
    expect(relaxed.contentWidthPx).toBe(compact.contentWidthPx);
  });
});
