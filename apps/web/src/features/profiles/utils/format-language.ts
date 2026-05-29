export function formatLanguageDisplay(name?: string, level?: string): string {
  const lang = capitalizeWords(name?.trim() || '');
  const lvl = capitalizeWords(level?.trim() || '');
  if (!lang) return '—';
  if (!lvl) return lang;
  return `${lang} - ${lvl}`;
}

function capitalizeWords(value: string): string {
  return value
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
