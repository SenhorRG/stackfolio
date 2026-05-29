import {
  flattenPageSections,
  getHeaderAlign,
  getTheme,
  normalizeJsonLayoutSkillsDisplay,
  normalizePages,
  resolveSectionContent,
  syncPagesToProject,
  themeToCssVars,
  type JsonLayoutShape,
  type ProfileResumeSource,
  type ResumeSectionIdValue,
} from '@stackfolio/shared';
import {
  applyPageOverflow,
  type RenderPage,
} from './estimate-section-height';

export type { RenderPage };

export function prepareRenderLayout(
  project: {
    sectionOrder: unknown;
    visibility: unknown;
    jsonLayout: unknown;
    spacing: string;
  },
  profile: ProfileResumeSource,
): {
  themeCss: Record<string, string>;
  headerAlign: 'left' | 'center' | 'right';
  pages: RenderPage[];
  sectionOrder: ResumeSectionIdValue[];
  resolvedSections: Map<ResumeSectionIdValue, Record<string, unknown>>;
  legacyLineHeight: string;
} {
  const layout = normalizeJsonLayoutSkillsDisplay(
    (project.jsonLayout ?? { sections: {} }) as JsonLayoutShape,
  );
  const sectionOrder = (project.sectionOrder as ResumeSectionIdValue[]) ?? [];
  const visibility = (project.visibility ?? {}) as Record<string, boolean>;
  const theme = getTheme(layout, { spacing: project.spacing });
  const themeCss = themeToCssVars(theme);
  const legacySpacing: Record<string, string> = {
    compact: '0.75rem',
    normal: '1rem',
    relaxed: '1.35rem',
  };
  const legacyLineHeight = legacySpacing[project.spacing] ?? '1rem';
  const manualPages = normalizePages(layout, sectionOrder);
  const resolvedSections = new Map<ResumeSectionIdValue, Record<string, unknown>>();

  for (const sectionId of sectionOrder) {
    if (sectionId === 'header') continue;
    resolvedSections.set(
      sectionId,
      resolveSectionContent(sectionId, layout.sections, profile),
    );
  }
  resolvedSections.set(
    'header',
    resolveSectionContent('header', layout.sections, profile),
  );

  const pages = applyPageOverflow(
    manualPages,
    visibility,
    resolvedSections,
    theme,
    layout.continuationOverrides,
    layout.pageMetricsTuning,
  );

  return {
    themeCss,
    headerAlign: getHeaderAlign(layout.sections),
    pages,
    sectionOrder: syncPagesToProject(layout, manualPages).sectionOrder,
    resolvedSections,
    legacyLineHeight,
  };
}

export function flattenManualPages(layout: JsonLayoutShape): ResumeSectionIdValue[] {
  return flattenPageSections(normalizePages(layout, []));
}
