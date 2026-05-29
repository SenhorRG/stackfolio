import type { Skill } from '@prisma/client';
import { buildSkillExportPayload } from './build-skill-export';

const baseRow: Skill = {
  id: 'skill_1',
  name: 'TypeScript',
  slug: 'typescript',
  category: 'language',
  description: 'Typed JavaScript',
  urls: { official: 'https://www.typescriptlang.org/' },
  resources: { categories: ['language'] },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
};

describe('buildSkillExportPayload', () => {
  it('maps catalog rows with export metadata', () => {
    const payload = buildSkillExportPayload([baseRow]);
    expect(payload.version).toBe(1);
    expect(payload.count).toBe(1);
    expect(payload.skills[0]).toMatchObject({
      id: 'skill_1',
      name: 'TypeScript',
      slug: 'typescript',
      category: 'language',
      categories: ['language'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    });
    expect(payload.exportedAt).toEqual(expect.any(String));
  });
});
