import { z } from 'zod';
import { ResumeSectionId } from '../enums/resume-section';

const sectionIdEnum = z.enum(ResumeSectionId);

const forbiddenPositionKeys = z
  .object({
    x: z.never().optional(),
    y: z.never().optional(),
    left: z.never().optional(),
    top: z.never().optional(),
    position: z.never().optional(),
  })
  .strict();

export const resumeSectionContentSchema = z
  .record(z.string(), z.unknown())
  .and(forbiddenPositionKeys);

const typographyUnit = z
  .string()
  .regex(/^\d+(\.\d+)?pt$/, 'Use pt units (e.g. 11pt, 14pt)');

const resumeTypographySchema = z
  .object({
    fontSize: typographyUnit,
    lineHeight: typographyUnit,
    sectionGap: typographyUnit,
  })
  .partial();

const resumePageSchema = z.object({
  id: z.string(),
  sectionIds: z.array(sectionIdEnum),
});

const sectionConfigSchema = resumeSectionContentSchema
  .and(
    z
      .object({
        source: z.enum(['profile', 'custom']).optional(),
        align: z.enum(['left', 'center', 'right']).optional(),
        overrides: resumeSectionContentSchema.optional(),
      })
      .partial(),
  );

export const jsonLayoutSchema = z
  .object({
    theme: resumeTypographySchema.optional(),
    pages: z.array(resumePageSchema).optional(),
    sections: z.record(sectionIdEnum, sectionConfigSchema),
  })
  .strict();

export const resumeProjectSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  name: z.string().default('My Resume'),
  theme: z.string().default('classic'),
  font: z.string().default('inter'),
  spacing: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
  sectionOrder: z.array(sectionIdEnum),
  visibility: z.record(sectionIdEnum, z.boolean()),
  dividerStyle: z.enum(['none', 'line', 'dotted']).default('line'),
  pageCount: z.number().int().min(1).max(50).default(1),
  jsonLayout: jsonLayoutSchema,
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type ResumeProject = z.infer<typeof resumeProjectSchema>;
export type JsonLayout = z.infer<typeof jsonLayoutSchema>;

export const createResumeProjectSchema = z.object({
  profileId: z.string(),
  name: z.string().optional(),
  theme: z.string().optional(),
  font: z.string().optional(),
  spacing: resumeProjectSchema.shape.spacing.optional(),
  sectionOrder: z.array(sectionIdEnum).optional(),
  visibility: z.record(sectionIdEnum, z.boolean()).optional(),
  dividerStyle: resumeProjectSchema.shape.dividerStyle.optional(),
  pageCount: z.number().int().min(1).max(50).optional(),
  jsonLayout: jsonLayoutSchema.optional(),
});

export const updateResumeProjectSchema = createResumeProjectSchema
  .omit({ profileId: true })
  .partial();

export const ResumeSectionConfig = {
  header: { fields: ['fullName', 'title', 'email', 'phone', 'location'] },
  summary: { fields: ['text'] },
  skills: { fields: ['display', 'items'] },
  experience: { fields: ['items'] },
  education: { fields: ['items'] },
  projects: { fields: ['items'] },
  certifications: { fields: ['items'] },
  languages: { fields: ['items'] },
  links: { fields: ['items'] },
} as const;
