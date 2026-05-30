import { serializeResumeForBackup } from './serialize-resume-for-backup';

describe('serializeResumeForBackup', () => {
  it('preserves jsonLayout continuation and typography fields', () => {
    const result = serializeResumeForBackup({
      id: 'resume-1',
      profileId: 'profile-1',
      name: 'CV',
      theme: 'classic',
      font: 'inter',
      spacing: 'normal',
      sectionOrder: ['header', 'skills'],
      visibility: { header: true, skills: true },
      dividerStyle: 'line',
      pageCount: 2,
      jsonLayout: {
        theme: { fontSize: '11pt', lineHeight: '14pt', sectionGap: '10pt' },
        pages: [
          {
            id: 'page-1',
            sectionIds: ['header', 'skills'],
            continuationSectionIds: ['skills'],
          },
          { id: 'page-2', sectionIds: ['experience'] },
        ],
        detachedSectionIds: ['links'],
        continuationOverrides: { 'page-1:skills': 'overflow-only' },
        pageMetricsTuning: { maxLinesPerPage: 40 },
        sections: { skills: { source: 'profile', display: 'comma' } },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(result.jsonLayout.continuationOverrides).toEqual({
      'page-1:skills': 'overflow-only',
    });
    expect(result.jsonLayout.detachedSectionIds).toEqual(['links']);
    expect(result.jsonLayout.pageMetricsTuning).toEqual({ maxLinesPerPage: 40 });
    const pages = result.jsonLayout.pages as
      | Array<{ continuationSectionIds?: string[] }>
      | undefined;
    expect(pages?.[0]?.continuationSectionIds).toEqual(['skills']);
  });
});
