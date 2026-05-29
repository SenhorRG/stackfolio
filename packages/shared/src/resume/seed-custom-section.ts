import type { ResumeSectionIdValue } from '../enums/resume-section';
import type {
  JsonLayoutShape,
  ProfileResumeSource,
  ResumeSectionLayoutConfig,
} from './layout-types';
import { resolveProfilePersonName } from '../profiles/resolve-profile-person-name';
import { resolveSectionContent } from './resolve-section-content';
import { normalizeSkillsDisplay, profileSkillItems } from './skills-by-category';

function cloneItems(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) =>
    item && typeof item === 'object' ? { ...(item as Record<string, unknown>) } : item,
  );
}

export function seedSectionAsCustom(
  sectionId: ResumeSectionIdValue,
  config: ResumeSectionLayoutConfig | undefined,
  profile: ProfileResumeSource,
): ResumeSectionLayoutConfig {
  const current = config ?? {};
  const profileLayout: JsonLayoutShape['sections'] = {
    [sectionId]: { ...current, source: 'profile' },
  };
  const resolved = resolveSectionContent(sectionId, profileLayout, profile);
  const { sectionTitle, ...content } = resolved;
  void sectionTitle;

  if (sectionId === 'header') {
    return {
      ...current,
      source: 'custom',
      fullName: String(content.fullName ?? resolveProfilePersonName(profile)),
      title: String(content.title ?? ''),
      email: String(content.email ?? ''),
      phone: String(content.phone ?? ''),
      location: String(content.location ?? ''),
    };
  }

  if (sectionId === 'summary') {
    return {
      ...current,
      source: 'custom',
      text: String(content.text ?? ''),
    };
  }

  if (sectionId === 'skills') {
    const items = profileSkillItems(profile);
    return {
      ...current,
      source: 'custom',
      display: normalizeSkillsDisplay(current.display ?? content.display),
      items: cloneItems(content.items).length
        ? cloneItems(content.items)
        : items,
      skillCategories: current.skillCategories,
    };
  }

  return {
    ...current,
    source: 'custom',
    items: cloneItems(content.items),
  };
}
