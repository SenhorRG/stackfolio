import { buildImportedDisplayName } from './build-imported-display-name';

describe('buildImportedDisplayName', () => {
  it('prefixes the desired name with (IMPORTED)', () => {
    expect(buildImportedDisplayName('My Profile')).toBe('(IMPORTED) My Profile');
  });

  it('strips legacy imported suffix before prefixing', () => {
    expect(buildImportedDisplayName('Dev (imported)')).toBe('(IMPORTED) Dev');
    expect(buildImportedDisplayName('Dev (imported) 2')).toBe('(IMPORTED) Dev');
  });

  it('avoids double prefix when already imported', () => {
    expect(buildImportedDisplayName('(IMPORTED) My Profile')).toBe(
      '(IMPORTED) My Profile',
    );
  });
});
