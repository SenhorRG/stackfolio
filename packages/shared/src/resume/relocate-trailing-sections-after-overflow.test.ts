import { describe, expect, it } from 'vitest';
import {
  formatLinkUrlForDisplay,
  normalizeLinkUrl,
  resolveHeaderLinkUrls,
} from './section-display-options';
import { relocateTrailingSectionsAfterOverflow } from './relocate-trailing-sections-after-overflow';
import type { RenderPage } from './page-overflow';

describe('formatLinkUrlForDisplay', () => {
  it('removes http or https prefix', () => {
    expect(formatLinkUrlForDisplay('https://github.com/user')).toBe(
      'github.com/user',
    );
    expect(formatLinkUrlForDisplay('http://example.com')).toBe('example.com');
  });

  it('deduplicates embedded host from legacy normalized urls', () => {
    expect(formatLinkUrlForDisplay('https://linkedin.com/linkedin.com/in/user')).toBe(
      'linkedin.com/in/user',
    );
  });
});

describe('normalizeLinkUrl', () => {
  it('does not prepend host when url already includes it', () => {
    expect(normalizeLinkUrl('linkedin.com/in/user', 'linkedin.com')).toBe(
      'https://linkedin.com/in/user',
    );
  });
});

describe('resolveHeaderLinkUrls', () => {
  it('returns display urls without labels', () => {
    expect(
      resolveHeaderLinkUrls([
        { label: 'GitHub', url: 'https://github.com/user' },
        { label: 'Site', url: 'https://example.com' },
      ]),
    ).toEqual(['github.com/user', 'example.com']);
  });
});

describe('relocateTrailingSectionsAfterOverflow', () => {
  it('moves sections after an overflowing section to the next page', () => {
    const renderPages: RenderPage[] = [
      {
        id: 'page-1',
        sectionIds: ['skills', 'experience'],
        slices: [{ sectionId: 'skills', showHeading: true }],
      },
      {
        id: 'page-2',
        sectionIds: ['skills', 'experience'],
        slices: [
          { sectionId: 'skills', showHeading: false },
          { sectionId: 'experience', showHeading: true },
        ],
      },
    ];

    const relocated = relocateTrailingSectionsAfterOverflow(
      [{ id: 'page-1', sectionIds: ['skills', 'experience', 'education'] }],
      renderPages,
    );

    expect(relocated[0]?.sectionIds).toEqual(['skills']);
    expect(relocated[1]?.sectionIds).toEqual(['experience', 'education']);
  });
});
