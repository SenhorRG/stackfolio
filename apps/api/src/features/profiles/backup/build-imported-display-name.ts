const IMPORTED_PREFIX = '(IMPORTED) ';
const LEGACY_IMPORTED_SUFFIX = / \(imported\)( \d+)?$/i;

export function buildImportedDisplayName(desired: string): string {
  const trimmed = desired.trim();
  const withoutLegacySuffix = trimmed.replace(LEGACY_IMPORTED_SUFFIX, '');
  const withoutPrefix = withoutLegacySuffix.startsWith(IMPORTED_PREFIX)
    ? withoutLegacySuffix.slice(IMPORTED_PREFIX.length).trimStart()
    : withoutLegacySuffix;
  return `${IMPORTED_PREFIX}${withoutPrefix}`;
}
