export const ResumeSectionId = [
  'header',
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
  'certifications',
  'languages',
  'links',
] as const;

export type ResumeSectionIdValue = (typeof ResumeSectionId)[number];

export const ResumeSectionLabel: Record<ResumeSectionIdValue, string> = {
  header: 'Header',
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  links: 'Links',
};

export const DEFAULT_SECTION_ORDER: ResumeSectionIdValue[] = [
  ...ResumeSectionId,
];
