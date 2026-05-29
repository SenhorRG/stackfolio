import type { JsonLayoutShape, ResumeTypography } from './layout-types';

const DEFAULT_TYPOGRAPHY: ResumeTypography = {
  fontSize: '11pt',
  lineHeight: '14pt',
  sectionGap: '12pt',
};

const UNIT_PATTERN = /^\d+(\.\d+)?pt$/;

export function isTypographyUnit(value: string): boolean {
  return UNIT_PATTERN.test(value.trim());
}

export function getTheme(
  layout: JsonLayoutShape | Record<string, unknown>,
  options?: { spacing?: string },
): ResumeTypography {
  const raw = (layout as JsonLayoutShape).theme ?? {};
  const preset = options?.spacing
    ? spacingPresetToTypography(options.spacing)
    : {};
  const merged = { ...preset, ...raw };
  return {
    fontSize:
      typeof merged.fontSize === 'string' && isTypographyUnit(merged.fontSize)
        ? merged.fontSize
        : DEFAULT_TYPOGRAPHY.fontSize,
    lineHeight:
      typeof merged.lineHeight === 'string' && isTypographyUnit(merged.lineHeight)
        ? merged.lineHeight
        : DEFAULT_TYPOGRAPHY.lineHeight,
    sectionGap:
      typeof merged.sectionGap === 'string' && isTypographyUnit(merged.sectionGap)
        ? merged.sectionGap
        : DEFAULT_TYPOGRAPHY.sectionGap,
  };
}

export function themeToCssVars(theme: ResumeTypography): Record<string, string> {
  return {
    '--cv-font-size': theme.fontSize,
    '--cv-line-height': theme.lineHeight,
    '--cv-section-gap': theme.sectionGap,
  };
}

export function spacingPresetToTypography(
  spacing: string,
): Partial<ResumeTypography> {
  switch (spacing) {
    case 'compact':
      return { fontSize: '10pt', lineHeight: '12pt', sectionGap: '8pt' };
    case 'relaxed':
      return { fontSize: '12pt', lineHeight: '18pt', sectionGap: '16pt' };
    default:
      return { fontSize: '11pt', lineHeight: '14pt', sectionGap: '12pt' };
  }
}
