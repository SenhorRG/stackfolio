import type { ResumeSectionIdValue } from '../enums/resume-section';
import type { ProfileIdentity } from '../entities/profile-identity';
import type { PageMetricsTuning } from './page-metrics-tuning';

export type HeaderAlign = 'left' | 'center' | 'right';

export type ResumeTypography = {
  fontSize: string;
  lineHeight: string;
  sectionGap: string;
};

/** How overflow content continues onto a later page (key: `${pageId}:${sectionId}`). */
export type ContinuationMode = 'overflow-only' | 'entire-subsection';

export type ResumePageLayout = {
  id: string;
  sectionIds: ResumeSectionIdValue[];
  /** Visual-only overflow slices synced from render; not draggable or editable. */
  continuationSectionIds?: ResumeSectionIdValue[];
};

export type SectionDataSource = 'profile' | 'custom';

export type ResumeSectionLayoutConfig = {
  source?: SectionDataSource;
  align?: HeaderAlign;
  /** Custom heading for this section in the CV (not the job title in the header block). */
  sectionTitle?: string;
  /** Job title line in the header block only. */
  title?: string;
  overrides?: Record<string, unknown>;
  [key: string]: unknown;
};

export type JsonLayoutShape = {
  theme?: Partial<ResumeTypography>;
  pages?: ResumePageLayout[];
  /** Sections removed from pages; hidden from preview until placed on a page again. */
  detachedSectionIds?: ResumeSectionIdValue[];
  /** Per-page continuation behavior for overflow rows (`${pageId}:${sectionId}`). */
  continuationOverrides?: Record<string, ContinuationMode>;
  /** Editor tuning for page layout and pagination limits (optional). */
  pageMetricsTuning?: PageMetricsTuning;
  sections: Partial<Record<ResumeSectionIdValue, ResumeSectionLayoutConfig>>;
};

export type ProfileResumeSource = {
  name: string;
  profileData?: unknown;
  identity?: ProfileIdentity;
  skills: Array<{
    level: string;
    years: number | null;
    highlight: boolean;
    displayCategory?: string | null;
    skill: {
      name: string;
      category: string;
      slug: string;
      categories?: string[];
      resources?: unknown;
    };
  }>;
};
