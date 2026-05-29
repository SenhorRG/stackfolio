import { Prisma } from '@prisma/client';

const UPDATABLE_KEYS = [
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

export function toResumeProjectUpdateInput(
  body: Record<string, unknown>,
): Prisma.ResumeProjectUpdateInput {
  const data: Prisma.ResumeProjectUpdateInput = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.theme === 'string') data.theme = body.theme;
  if (typeof body.font === 'string') data.font = body.font;
  if (typeof body.spacing === 'string') data.spacing = body.spacing;
  if (body.sectionOrder !== undefined) {
    data.sectionOrder = body.sectionOrder as Prisma.InputJsonValue;
  }
  if (body.visibility !== undefined) {
    data.visibility = body.visibility as Prisma.InputJsonValue;
  }
  if (typeof body.dividerStyle === 'string') data.dividerStyle = body.dividerStyle;
  if (typeof body.pageCount === 'number') data.pageCount = body.pageCount;
  if (body.jsonLayout !== undefined) {
    data.jsonLayout = body.jsonLayout as Prisma.InputJsonValue;
  }
  return data;
}

export function hasResumeUpdateFields(data: Prisma.ResumeProjectUpdateInput): boolean {
  return UPDATABLE_KEYS.some((key) => data[key as keyof Prisma.ResumeProjectUpdateInput] !== undefined);
}
