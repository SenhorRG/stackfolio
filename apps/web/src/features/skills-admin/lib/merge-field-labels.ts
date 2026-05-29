import type { MergeSkillFieldKey } from '@stackfolio/shared';

export const MERGE_FIELD_ROWS: Array<{
  key: MergeSkillFieldKey;
  label: string;
}> = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'category', label: 'Primary category' },
  { key: 'description', label: 'Description' },
  { key: 'urlOfficial', label: 'Official URL' },
  { key: 'urlDocs', label: 'Docs URL' },
  { key: 'urlGithub', label: 'GitHub URL' },
  { key: 'urlRoadmap', label: 'Roadmap URL' },
  { key: 'resourceCategories', label: 'Resource categories' },
  { key: 'resources', label: 'Resources (merge lists)' },
];
