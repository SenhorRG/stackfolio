export function formFieldId(...parts: (string | number)[]): string {
  return parts
    .map(String)
    .join('-')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
