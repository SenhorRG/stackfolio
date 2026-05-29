import type { SkillResourcesInput } from './skill-resources-schema';
import type { MergeSkillFieldKey } from './merge-skills-schema';
import type { UpdateSkillAdminInput } from './update-skill-admin-schema';

export type SkillMergeSnapshot = {
  name: string;
  slug: string;
  category: string;
  description: string | null;
  urls: Record<string, string> | null;
  resources: SkillResourcesInput | null;
  categories: string[];
};

const URL_FIELD_TO_KEY: Record<
  Extract<
    MergeSkillFieldKey,
    'urlOfficial' | 'urlDocs' | 'urlGithub' | 'urlRoadmap'
  >,
  keyof NonNullable<UpdateSkillAdminInput['urls']>
> = {
  urlOfficial: 'official',
  urlDocs: 'docs',
  urlGithub: 'github',
  urlRoadmap: 'roadmap',
};

function adopt(
  adoptFromSecondary: ReadonlySet<MergeSkillFieldKey>,
  field: MergeSkillFieldKey,
): boolean {
  return adoptFromSecondary.has(field);
}

function pickScalar(
  preferred: string,
  secondary: string,
  field: MergeSkillFieldKey,
  adoptFromSecondary: ReadonlySet<MergeSkillFieldKey>,
): string {
  return adopt(adoptFromSecondary, field) ? secondary : preferred;
}

function pickNullable(
  preferred: string | null,
  secondary: string | null,
  field: MergeSkillFieldKey,
  adoptFromSecondary: ReadonlySet<MergeSkillFieldKey>,
): string | null {
  if (adopt(adoptFromSecondary, field)) {
    return secondary ?? preferred;
  }
  return preferred ?? secondary;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function mergeResourceArrays(
  preferred: string[] | undefined,
  secondary: string[] | undefined,
): string[] {
  return uniqueStrings([...(preferred ?? []), ...(secondary ?? [])]);
}

function mergeRecordOfArrays(
  preferred: Record<string, string[]> | undefined,
  secondary: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined {
  const keys = new Set([
    ...Object.keys(preferred ?? {}),
    ...Object.keys(secondary ?? {}),
  ]);
  if (keys.size === 0) return preferred ?? secondary;

  const merged: Record<string, string[]> = {};
  for (const key of keys) {
    merged[key] = mergeResourceArrays(preferred?.[key], secondary?.[key]);
  }
  return merged;
}

export function mergeSkillResources(
  preferred: SkillResourcesInput | null,
  secondary: SkillResourcesInput | null,
): SkillResourcesInput {
  const base = { ...(preferred ?? {}) };
  const other = secondary ?? {};
  const result: SkillResourcesInput = { ...base };

  for (const [key, secondaryValue] of Object.entries(other)) {
    const preferredValue = (base as Record<string, unknown>)[key];
    if (Array.isArray(secondaryValue)) {
      const preferredArray = Array.isArray(preferredValue)
        ? (preferredValue as string[])
        : [];
      (result as Record<string, unknown>)[key] = mergeResourceArrays(
        preferredArray,
        secondaryValue,
      );
      continue;
    }
    if (
      secondaryValue &&
      typeof secondaryValue === 'object' &&
      !Array.isArray(secondaryValue)
    ) {
      const preferredRecord =
        preferredValue &&
        typeof preferredValue === 'object' &&
        !Array.isArray(preferredValue)
          ? (preferredValue as Record<string, string[]>)
          : undefined;
      (result as Record<string, unknown>)[key] = mergeRecordOfArrays(
        preferredRecord,
        secondaryValue as Record<string, string[]>,
      );
    }
  }

  return result;
}

export function buildMergedSkillUpdate(
  preferred: SkillMergeSnapshot,
  secondary: SkillMergeSnapshot,
  adoptFromSecondary: readonly MergeSkillFieldKey[],
): UpdateSkillAdminInput {
  const adoptSet = new Set(adoptFromSecondary);
  const preferredUrls = preferred.urls ?? {};
  const secondaryUrls = secondary.urls ?? {};
  const urls: NonNullable<UpdateSkillAdminInput['urls']> = {};

  for (const [field, urlKey] of Object.entries(URL_FIELD_TO_KEY) as Array<
    [keyof typeof URL_FIELD_TO_KEY, keyof NonNullable<UpdateSkillAdminInput['urls']>]
  >) {
    const preferredUrl = preferredUrls[urlKey];
    const secondaryUrl = secondaryUrls[urlKey];
    const value = adopt(adoptSet, field)
      ? (secondaryUrl ?? preferredUrl)
      : (preferredUrl ?? secondaryUrl);
    if (value) urls[urlKey] = value;
  }

  let categories = preferred.categories.length
    ? preferred.categories
    : [preferred.category];
  if (adopt(adoptSet, 'resourceCategories')) {
    categories = uniqueStrings([
      ...categories,
      ...(secondary.categories.length
        ? secondary.categories
        : [secondary.category]),
    ]);
  }

  let resources: SkillResourcesInput =
    preferred.resources ?? ({ categories } as SkillResourcesInput);
  if (adopt(adoptSet, 'resources')) {
    resources = mergeSkillResources(
      preferred.resources ?? { categories },
      secondary.resources ?? {
        categories: secondary.categories.length
          ? secondary.categories
          : [secondary.category],
      },
    );
  } else if (adopt(adoptSet, 'resourceCategories')) {
    resources = {
      ...resources,
      categories,
    };
  } else if (categories.length > 0) {
    resources = { ...resources, categories };
  }

  return {
    name: pickScalar(preferred.name, secondary.name, 'name', adoptSet),
    slug: pickScalar(preferred.slug, secondary.slug, 'slug', adoptSet),
    category: pickScalar(
      preferred.category,
      secondary.category,
      'category',
      adoptSet,
    ),
    description: pickNullable(
      preferred.description,
      secondary.description,
      'description',
      adoptSet,
    ),
    urls: Object.keys(urls).length > 0 ? urls : undefined,
    resources,
  };
}
