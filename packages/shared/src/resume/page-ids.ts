import type { ResumePageLayout } from './layout-types';

export function ensureUniquePageIds(
  pages: ResumePageLayout[],
): ResumePageLayout[] {
  const seen = new Set<string>();
  return pages.map((page, index) => {
    let id = page.id?.trim() || '';
    if (!id || seen.has(id)) {
      const prefix = index === 0 ? 'page' : 'overflow';
      let n = index + 1;
      id = `${prefix}-${n}`;
      while (seen.has(id)) {
        n += 1;
        id = `${prefix}-${n}`;
      }
    }
    seen.add(id);
    return { ...page, id };
  });
}
