const DRAFT_KEYS = [
  'name',
  'theme',
  'font',
  'spacing',
  'sectionOrder',
  'visibility',
  'dividerStyle',
  'pageCount',
  'jsonLayout',
] as const;

export function mergeResumeDraft<T extends Record<string, unknown>>(
  project: T,
  draft: Record<string, unknown>,
): T {
  const merged = { ...project };
  for (const key of DRAFT_KEYS) {
    if (draft[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = draft[key];
    }
  }
  return merged;
}
