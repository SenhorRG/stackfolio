import { describe, expect, it } from 'vitest';
import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { JsonLayoutShape, ProfileResumeSource } from './layout-types';
import {
  renderPagesToEditorPages,
  syncEditorPagesFromRender,
} from './sync-render-pages';

const profile: ProfileResumeSource = {
  name: 'Test User',
  skills: [],
};

describe('syncEditorPagesFromRender', () => {
  it('keeps continued section on primary page after section content grows', () => {
    const fillerSkills = {
      source: 'custom' as const,
      items: Array.from({ length: 96 }, (_, index) => ({
        name: `Skill ${index}`,
        categories: [`cat-${index % 8}`],
      })),
      display: 'comma',
    };
    const experienceItems = Array.from({ length: 12 }, (_, index) => ({
      company: `Company ${index}`,
      role: 'Engineer',
      bullets: ['Line one', 'Line two', 'Line three'],
    }));

    const layout: JsonLayoutShape = {
      sections: {
        skills: fillerSkills,
        experience: {
          source: 'custom',
          items: experienceItems.map((item, index) =>
            index === 0
              ? {
                  ...item,
                  bullets: Array.from({ length: 40 }, (_, bulletIndex) => {
                    return `Achievement ${bulletIndex + 1}`;
                  }),
                }
              : item,
          ),
        },
      },
      pages: [
        {
          id: 'page-1',
          sectionIds: ['skills', 'experience'] as ResumeSectionIdValue[],
        },
        {
          id: 'page-2',
          sectionIds: [],
          continuationSectionIds: ['experience'] as ResumeSectionIdValue[],
        },
      ],
    };

    const sectionOrder = ['header', 'skills', 'experience'] as ResumeSectionIdValue[];
    const nextPages = syncEditorPagesFromRender(
      layout,
      sectionOrder,
      {},
      profile,
    );

    expect(nextPages).not.toBeNull();
    expect(nextPages![0]!.sectionIds).toContain('experience');
    expect(nextPages![1]!.continuationSectionIds).toContain('experience');
    expect(nextPages![1]!.sectionIds).not.toContain('experience');
  });
});

describe('renderPagesToEditorPages', () => {
  it('marks repeated section ids as continuation rows', () => {
    const pages = renderPagesToEditorPages([
      {
        id: 'page-1',
        sectionIds: ['skills', 'experience'],
        slices: [],
      },
      {
        id: 'page-2',
        sectionIds: ['experience'],
        slices: [],
      },
    ]);

    expect(pages[0]!.sectionIds).toEqual(['skills', 'experience']);
    expect(pages[1]!.sectionIds).toEqual([]);
    expect(pages[1]!.continuationSectionIds).toEqual(['experience']);
  });

  it('orders continuationSectionIds by render slice order on overflow pages', () => {
    const manualPages = [
      {
        id: 'page-1',
        sectionIds: ['skills', 'experience'] as ResumeSectionIdValue[],
      },
      {
        id: 'page-2',
        sectionIds: [] as ResumeSectionIdValue[],
        continuationSectionIds: ['experience', 'skills'] as ResumeSectionIdValue[],
      },
    ];

    const sectionOrder = [
      'header',
      'skills',
      'experience',
    ] as ResumeSectionIdValue[];
    const pages = renderPagesToEditorPages(
      [
        {
          id: 'page-1',
          sectionIds: ['skills'],
          slices: [],
        },
        {
          id: 'page-2',
          sectionIds: ['skills', 'experience'],
          slices: [
            { sectionId: 'skills', showHeading: false },
            { sectionId: 'skills', showHeading: false },
            { sectionId: 'experience', showHeading: false },
          ],
        },
      ],
      manualPages,
      sectionOrder,
    );

    expect(pages[1]!.continuationSectionIds).toEqual(['skills']);
  });

  it('preserves manual primary page when overflow slices start on a later page', () => {
    const manualPages = [
      {
        id: 'page-1',
        sectionIds: ['skills', 'experience'] as ResumeSectionIdValue[],
      },
      {
        id: 'page-2',
        sectionIds: [] as ResumeSectionIdValue[],
        continuationSectionIds: ['experience'] as ResumeSectionIdValue[],
      },
    ];

    const pages = renderPagesToEditorPages(
      [
        {
          id: 'page-1',
          sectionIds: ['skills'],
          slices: [],
        },
        {
          id: 'page-2',
          sectionIds: ['experience'],
          slices: [{ sectionId: 'experience', showHeading: true }],
        },
      ],
      manualPages,
    );

    expect(pages[0]!.sectionIds).toEqual(['skills', 'experience']);
    expect(pages[1]!.sectionIds).toEqual([]);
    expect(pages[1]!.continuationSectionIds).toBeUndefined();
  });

  it('marks sections that continue in render output across pages', () => {
    const pages = renderPagesToEditorPages([
      {
        id: 'page-1',
        sectionIds: ['skills', 'experience'],
        slices: [{ sectionId: 'experience', showHeading: true }],
      },
      {
        id: 'page-2',
        sectionIds: ['experience'],
        slices: [{ sectionId: 'experience', showHeading: false }],
      },
    ]);

    expect(pages[1]!.continuationSectionIds).toEqual(['experience']);
  });
});
