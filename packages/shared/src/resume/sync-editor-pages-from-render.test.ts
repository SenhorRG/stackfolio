import { describe, expect, it } from 'vitest';
import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { JsonLayoutShape } from './layout-types';
import { syncEditorPagesFromRender } from './sync-render-pages';

const profile = { name: 'Profile Label', skills: [] };

describe('syncEditorPagesFromRender', () => {
  it('preserves manual primary sectionIds and only updates continuation rows', () => {
    const layout: JsonLayoutShape = {
      sections: {
        skills: {
          source: 'custom',
          categories: Array.from({ length: 6 }, (_, categoryIndex) => ({
            label: `Category ${categoryIndex}`,
            display: 'comma',
            skills: Array.from({ length: 14 }, (_, skillIndex) => ({
              name: `Skill ${categoryIndex}-${skillIndex}`,
            })),
          })),
        },
        experience: {
          source: 'custom',
          items: Array.from({ length: 12 }, (_, index) => ({
            company: `Company ${index}`,
            role: 'Engineer',
            bullets: ['Line one', 'Line two', 'Line three'],
          })),
        },
      },
      pages: [
        {
          id: 'page-1',
          sectionIds: ['skills', 'experience'] as ResumeSectionIdValue[],
        },
        {
          id: 'page-2',
          sectionIds: [] as ResumeSectionIdValue[],
        },
      ],
    };

    const sectionOrder = [
      'header',
      'skills',
      'experience',
    ] as ResumeSectionIdValue[];

    const nextPages = syncEditorPagesFromRender(
      layout,
      sectionOrder,
      {},
      profile,
    );

    expect(nextPages).not.toBeNull();
    expect(nextPages![0]!.sectionIds).toEqual(['skills', 'experience']);
    expect(nextPages![0]!.id).toBe('page-1');
  });
});
