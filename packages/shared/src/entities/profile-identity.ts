import { z } from 'zod';

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Invalid email address',
  });

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^https?:\/\/.+/i.test(v), {
    message: 'URL must start with http:// or https://',
  });

const optionalPhone = z
  .string()
  .trim()
  .max(32)
  .optional()
  .refine((v) => !v || /^[\d\s+().-]+$/.test(v), {
    message: 'Invalid phone number',
  });

export const profileContactSchema = z.object({
  email: optionalEmail,
  phone: optionalPhone,
  location: z.string().trim().max(120).optional(),
});

export const profileExperienceItemSchema = z.object({
  company: z.string(),
  role: z.string().optional(),
  period: z.string().optional(),
  description: z.string().optional(),
});

export const profileEducationItemSchema = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  period: z.string().optional(),
  description: z.string().optional(),
});

export const profileCertificateItemSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
});

export const profileProjectItemSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  description: z.string().trim().max(2000).optional(),
  url: optionalUrl,
  skillSlugs: z.array(z.string()).optional(),
});

export const profileLinkItemSchema = z.object({
  label: z.string().trim().min(1, 'Link label is required'),
  url: z
    .string()
    .trim()
    .min(1, 'URL is required')
    .refine((v) => /^https?:\/\/.+/i.test(v), {
      message: 'URL must start with http:// or https://',
    }),
});

export const profileLanguageItemSchema = z.object({
  name: z.string(),
  level: z.string().optional(),
});

/** Strict schema — used when saving profile data. */
export const profileIdentitySchema = z.object({
  /** Person name shown on resumes (distinct from profile label). */
  fullName: z.string().trim().max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  summary: z.string().default(''),
  contact: profileContactSchema.default({}),
  experience: z.array(profileExperienceItemSchema).default([]),
  education: z.array(profileEducationItemSchema).default([]),
  certificates: z.array(profileCertificateItemSchema).default([]),
  projects: z.array(profileProjectItemSchema).default([]),
  links: z.array(profileLinkItemSchema).default([]),
  languages: z.array(profileLanguageItemSchema).default([]),
  /** Custom order for resume skill category groups (display labels). */
  skillCategoryOrder: z.array(z.string().trim().min(1).max(80)).optional(),
  /** When false, skill level is omitted from resume skill lines. */
  skillShowLevel: z.boolean().optional(),
  /** When false, years of experience are omitted from resume skill lines. */
  skillShowYears: z.boolean().optional(),
  /** Skill category labels hidden from the resume (still editable in profile). */
  hiddenSkillCategories: z.array(z.string().trim().min(1).max(80)).optional(),
});

/** Lenient schema — loads legacy/invalid DB rows without throwing. */
const profileIdentityLenientSchema = z.object({
  fullName: z.string().optional(),
  jobTitle: z.string().optional(),
  summary: z.string().default(''),
  contact: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
    })
    .default({}),
  experience: z.array(profileExperienceItemSchema).default([]),
  education: z.array(profileEducationItemSchema).default([]),
  certificates: z.array(profileCertificateItemSchema).default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(''),
        description: z.string().optional(),
        url: z.string().optional(),
        skillSlugs: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  links: z
    .array(
      z.object({
        label: z.string().default(''),
        url: z.string().default(''),
      }),
    )
    .default([]),
  languages: z.array(profileLanguageItemSchema).default([]),
  skillCategoryOrder: z.array(z.string()).optional(),
  skillShowLevel: z.boolean().optional(),
  skillShowYears: z.boolean().optional(),
  hiddenSkillCategories: z.array(z.string()).optional(),
});

export type ProfileIdentity = z.infer<typeof profileIdentitySchema>;
export type ProfileContact = z.infer<typeof profileContactSchema>;

export function emptyProfileIdentity(): ProfileIdentity {
  return profileIdentityLenientSchema.parse({});
}

/**
 * Reads profile data from DB/API without throwing on legacy invalid values.
 * Use validateProfileIdentity() before persisting.
 */
export function parseProfileIdentity(data: unknown): ProfileIdentity {
  if (data == null || typeof data !== 'object') return emptyProfileIdentity();
  const strict = profileIdentitySchema.safeParse(data);
  if (strict.success) return strict.data;
  const loose = profileIdentityLenientSchema.safeParse(data);
  if (loose.success) return loose.data;
  return emptyProfileIdentity();
}

export type ProfileIdentityValidation = {
  success: boolean;
  data?: ProfileIdentity;
  fieldErrors: Record<string, string>;
};

export function validateProfileIdentity(data: unknown): ProfileIdentityValidation {
  const result = profileIdentitySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, fieldErrors: {} };
  }
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'form';
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  return { success: false, fieldErrors };
}
