import { describe, expect, it } from 'vitest';
import { normalizeJsonLayoutForBackup } from './normalize-json-layout-for-backup';

describe('normalizeJsonLayoutForBackup', () => {
  it('preserves continuation, detached sections, and page metrics tuning', () => {
    const raw = {
      theme: { fontSize: '11pt', lineHeight: '14pt', sectionGap: '12pt' },
      pages: [
        {
          id: 'page-1',
          sectionIds: ['header', 'skills'],
          continuationSectionIds: ['skills'],
        },
      ],
      detachedSectionIds: ['links'],
      continuationOverrides: { 'page-1:skills': 'entire-subsection' },
      pageMetricsTuning: { maxLinesPerPage: 42 },
      sections: {
        skills: { source: 'profile', display: 'comma' },
      },
    };

    const result = normalizeJsonLayoutForBackup(raw);

    expect(result.theme).toEqual(raw.theme);
    expect(result.pages).toEqual(raw.pages);
    expect(result.detachedSectionIds).toEqual(['links']);
    expect(result.continuationOverrides).toEqual(raw.continuationOverrides);
    expect(result.pageMetricsTuning).toEqual({ maxLinesPerPage: 42 });
    expect(result.sections.skills).toEqual({ source: 'profile', display: 'comma' });
  });
});
