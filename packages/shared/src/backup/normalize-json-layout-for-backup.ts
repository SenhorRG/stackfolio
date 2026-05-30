import type { JsonLayoutShape } from '../resume/layout-types';

/**
 * Preserves the full resume layout document (pages, continuation, typography tuning, etc.).
 */
export function normalizeJsonLayoutForBackup(raw: unknown): JsonLayoutShape {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { sections: {} };
  }

  const layout = raw as JsonLayoutShape;
  const sections =
    layout.sections && typeof layout.sections === 'object'
      ? layout.sections
      : {};

  return {
    ...layout,
    sections,
  };
}
