import { describe, expect, it } from 'vitest';
import { STACKFOLIO_BACKUP_VERSION } from './backup-version';
import { parseStackfolioBackup } from './parse-stackfolio-backup';

describe('parseStackfolioBackup', () => {
  it('accepts a minimal valid backup', () => {
    const result = parseStackfolioBackup({
      stackfolioBackupVersion: STACKFOLIO_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      profiles: [],
      resumeProjects: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts exported skill displayCategory and layout continuation fields', () => {
    const result = parseStackfolioBackup({
      stackfolioBackupVersion: STACKFOLIO_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      profiles: [
        {
          exportId: 'p1',
          name: 'Dev',
          profileData: {
            fullName: 'Dev',
            summary: '',
            contact: {},
            experience: [],
            education: [],
            certificates: [],
            projects: [],
            links: [],
            languages: [],
            skillShowLevel: false,
          },
          skills: [
            {
              skillSlug: 'react',
              level: 'advanced',
              years: 2,
              highlight: false,
              displayCategory: 'Frontend',
            },
          ],
        },
      ],
      resumeProjects: [
        {
          exportId: 'r1',
          profileExportId: 'p1',
          name: 'CV',
          theme: 'classic',
          font: 'inter',
          spacing: 'normal',
          sectionOrder: ['header'],
          visibility: { header: true },
          dividerStyle: 'line',
          pageCount: 1,
          jsonLayout: {
            sections: { header: { source: 'profile' } },
            continuationOverrides: { 'page-1:skills': 'entire-subsection' },
            detachedSectionIds: ['links'],
          },
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profiles[0]?.skills[0]?.displayCategory).toBe('Frontend');
      expect(result.data.resumeProjects[0]?.jsonLayout.continuationOverrides).toEqual({
        'page-1:skills': 'entire-subsection',
      });
    }
  });

  it('rejects missing version', () => {
    const result = parseStackfolioBackup({ exportedAt: new Date().toISOString() });
    expect(result.success).toBe(false);
  });
});
