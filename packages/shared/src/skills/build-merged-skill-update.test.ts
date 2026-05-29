import { describe, expect, it } from 'vitest';
import { buildMergedSkillUpdate } from './build-merged-skill-update';
import type { SkillMergeSnapshot } from './build-merged-skill-update';

const preferred: SkillMergeSnapshot = {
  name: 'React',
  slug: 'react',
  category: 'frontend',
  description: 'Preferred description',
  urls: { official: 'https://react.dev' },
  resources: { categories: ['frontend'], sites: ['https://react.dev'] },
  categories: ['frontend'],
};

const secondary: SkillMergeSnapshot = {
  name: 'React.js',
  slug: 'react-js',
  category: 'library',
  description: 'Secondary description',
  urls: { docs: 'https://legacy.reactjs.org' },
  resources: { categories: ['library'], articles: { intro: ['https://example.com'] } },
  categories: ['library'],
};

describe('buildMergedSkillUpdate', () => {
  it('keeps preferred scalars when nothing is adopted', () => {
    const result = buildMergedSkillUpdate(preferred, secondary, []);
    expect(result.name).toBe('React');
    expect(result.slug).toBe('react');
    expect(result.description).toBe('Preferred description');
  });

  it('adopts selected scalar fields from secondary', () => {
    const result = buildMergedSkillUpdate(preferred, secondary, [
      'name',
      'description',
    ]);
    expect(result.name).toBe('React.js');
    expect(result.description).toBe('Secondary description');
    expect(result.slug).toBe('react');
  });

  it('merges resource categories when requested', () => {
    const result = buildMergedSkillUpdate(preferred, secondary, [
      'resourceCategories',
    ]);
    expect(result.resources?.categories).toEqual(['frontend', 'library']);
  });

  it('merges url keys individually', () => {
    const result = buildMergedSkillUpdate(preferred, secondary, ['urlDocs']);
    expect(result.urls).toEqual({
      official: 'https://react.dev',
      docs: 'https://legacy.reactjs.org',
    });
  });
});
