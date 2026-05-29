import type { SkillResources } from '@/features/skills/lib/skill-resources';
import type { Skill } from '@/features/skills/hooks/use-skills';
import type { UpdateSkillAdminInput } from '@stackfolio/shared';

export type SkillFormValues = {
  name: string;
  slug: string;
  category: string;
  description: string;
  resourceCategories: string;
  officialUrl: string;
  docsUrl: string;
  githubUrl: string;
  roadmapUrl: string;
  resourcesJson: string;
};

export function skillToFormValues(skill: Skill): SkillFormValues {
  const urls = (skill.urls as Record<string, string> | null) ?? {};
  const resources = skill.resources ?? {};
  const categories =
    skill.categories?.length
      ? skill.categories
      : (resources.categories ?? [skill.category]);

  return {
    name: skill.name,
    slug: skill.slug,
    category: skill.category,
    description: skill.description ?? '',
    resourceCategories: categories.join(', '),
    officialUrl: urls.official ?? '',
    docsUrl: urls.docs ?? '',
    githubUrl: urls.github ?? '',
    roadmapUrl: urls.roadmap ?? '',
    resourcesJson: JSON.stringify(resources, null, 2),
  };
}

function parseResourceCategories(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseResourcesJson(raw: string): SkillResources {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  return JSON.parse(trimmed) as SkillResources;
}

/** Full urls object from form (API replaces the whole `urls` JSON on PATCH). */
function buildUrlsFromFormValues(
  values: SkillFormValues,
): NonNullable<UpdateSkillAdminInput['urls']> {
  const urls: NonNullable<UpdateSkillAdminInput['urls']> = {};
  if (values.officialUrl.trim()) urls.official = values.officialUrl.trim();
  if (values.docsUrl.trim()) urls.docs = values.docsUrl.trim();
  if (values.githubUrl.trim()) urls.github = values.githubUrl.trim();
  if (values.roadmapUrl.trim()) urls.roadmap = values.roadmapUrl.trim();
  return urls;
}

function urlFieldsDirty(
  initial: SkillFormValues,
  current: SkillFormValues,
): boolean {
  return (
    initial.officialUrl.trim() !== current.officialUrl.trim() ||
    initial.docsUrl.trim() !== current.docsUrl.trim() ||
    initial.githubUrl.trim() !== current.githubUrl.trim() ||
    initial.roadmapUrl.trim() !== current.roadmapUrl.trim()
  );
}

function resourcesFormSliceChanged(
  initial: SkillFormValues,
  current: SkillFormValues,
): boolean {
  return (
    initial.resourceCategories.trim() !== current.resourceCategories.trim() ||
    initial.resourcesJson.trim() !== current.resourcesJson.trim()
  );
}

function resolveResourcesForFullUpdate(
  values: SkillFormValues,
): SkillResources | undefined {
  const trimmedJson = values.resourcesJson.trim();
  if (trimmedJson) {
    return parseResourcesJson(trimmedJson);
  }
  const categories = parseResourceCategories(values.resourceCategories);
  return categories.length > 0 ? { categories } : undefined;
}

function resolveResourcesForDirtyUpdate(
  initial: SkillFormValues,
  current: SkillFormValues,
): SkillResources | undefined {
  const jsonChanged =
    initial.resourcesJson.trim() !== current.resourcesJson.trim();
  const categoriesChanged =
    initial.resourceCategories.trim() !== current.resourceCategories.trim();
  const categories = parseResourceCategories(current.resourceCategories);

  if (jsonChanged) {
    const trimmed = current.resourcesJson.trim();
    if (!trimmed) {
      return categories.length > 0 ? { categories } : undefined;
    }
    const parsed = parseResourcesJson(trimmed);
    if (categoriesChanged) {
      return { ...parsed, categories };
    }
    return parsed;
  }

  if (categoriesChanged) {
    const baseJson =
      current.resourcesJson.trim() || initial.resourcesJson.trim();
    const base = baseJson ? parseResourcesJson(baseJson) : {};
    return { ...base, categories };
  }

  return undefined;
}

export function formValuesToUpdatePayload(
  values: SkillFormValues,
): UpdateSkillAdminInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    category: values.category.trim(),
    description: values.description.trim() || null,
    urls: buildUrlsFromFormValues(values),
    resources: resolveResourcesForFullUpdate(values),
  };
}

export function formValuesToDirtyUpdatePayload(
  initial: SkillFormValues,
  current: SkillFormValues,
): UpdateSkillAdminInput {
  const payload: UpdateSkillAdminInput = {};

  const name = current.name.trim();
  if (name !== initial.name.trim()) {
    payload.name = name;
  }

  const slug = current.slug.trim();
  if (slug !== initial.slug.trim()) {
    payload.slug = slug;
  }

  const category = current.category.trim();
  if (category !== initial.category.trim()) {
    payload.category = category;
  }

  const description = current.description.trim() || null;
  const initialDescription = initial.description.trim() || null;
  if (description !== initialDescription) {
    payload.description = description;
  }

  if (urlFieldsDirty(initial, current)) {
    payload.urls = buildUrlsFromFormValues(current);
  }

  if (resourcesFormSliceChanged(initial, current)) {
    payload.resources = resolveResourcesForDirtyUpdate(initial, current);
  }

  return payload;
}
