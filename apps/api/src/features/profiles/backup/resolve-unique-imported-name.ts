import { buildImportedDisplayName } from './build-imported-display-name';

export function resolveUniqueImportedName(
  desired: string,
  existingNames: Set<string>,
): string {
  const base = buildImportedDisplayName(desired);
  if (!existingNames.has(base)) {
    return base;
  }
  let index = 2;
  while (existingNames.has(`${base} ${index}`)) {
    index += 1;
  }
  return `${base} ${index}`;
}
