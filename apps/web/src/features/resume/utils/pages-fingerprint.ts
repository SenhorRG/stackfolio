import type { ResumePageLayout } from '@stackfolio/shared';

export function pagesFingerprint(pages: ResumePageLayout[]): string {
  return JSON.stringify(
    pages.map((page) => [
      page.id,
      ...page.sectionIds,
      ...(page.continuationSectionIds ?? []),
    ]),
  );
}
