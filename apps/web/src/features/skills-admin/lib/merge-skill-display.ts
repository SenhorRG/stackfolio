import type { Skill } from '@/features/skills/hooks/use-skills';
import type { MergeSkillFieldKey } from '@stackfolio/shared';
import { skillToFormValues } from './skill-form-values';

const URL_KEY_MAP: Record<
  Extract<
    MergeSkillFieldKey,
    'urlOfficial' | 'urlDocs' | 'urlGithub' | 'urlRoadmap'
  >,
  'officialUrl' | 'docsUrl' | 'githubUrl' | 'roadmapUrl'
> = {
  urlOfficial: 'officialUrl',
  urlDocs: 'docsUrl',
  urlGithub: 'githubUrl',
  urlRoadmap: 'roadmapUrl',
};

export function getMergeFieldDisplay(
  skill: Skill,
  field: MergeSkillFieldKey,
): string {
  const values = skillToFormValues(skill);
  if (field in URL_KEY_MAP) {
    const urlField = URL_KEY_MAP[field as keyof typeof URL_KEY_MAP];
    return values[urlField] || '—';
  }
  switch (field) {
    case 'name':
      return values.name;
    case 'slug':
      return values.slug;
    case 'category':
      return values.category;
    case 'description':
      return values.description.trim() || '—';
    case 'resourceCategories':
      return values.resourceCategories || '—';
    case 'resources':
      return values.resourcesJson.trim() || '—';
    default:
      return '—';
  }
}

function isEmptyMergeDisplay(value: string): boolean {
  return value === '—' || value.trim() === '';
}

export function fieldHasSecondaryValue(
  preferred: Skill,
  secondary: Skill,
  field: MergeSkillFieldKey,
): boolean {
  const preferredValue = getMergeFieldDisplay(preferred, field);
  const secondaryValue = getMergeFieldDisplay(secondary, field);
  if (isEmptyMergeDisplay(secondaryValue)) return false;
  if (isEmptyMergeDisplay(preferredValue)) return true;
  return secondaryValue !== preferredValue;
}
