import { resolveUniqueImportedName } from './resolve-unique-imported-name';

describe('resolveUniqueImportedName', () => {
  it('always prefixes with (IMPORTED) when unused', () => {
    expect(resolveUniqueImportedName('Dev', new Set(['Other']))).toBe(
      '(IMPORTED) Dev',
    );
  });

  it('appends numeric suffix on collision', () => {
    const names = new Set(['(IMPORTED) Dev']);
    expect(resolveUniqueImportedName('Dev', names)).toBe('(IMPORTED) Dev 2');
  });

  it('increments suffix until unique', () => {
    const names = new Set(['(IMPORTED) Dev', '(IMPORTED) Dev 2']);
    expect(resolveUniqueImportedName('Dev', names)).toBe('(IMPORTED) Dev 3');
  });
});
