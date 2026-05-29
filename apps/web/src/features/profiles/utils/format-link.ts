export function formatLinkDisplay(label?: string, url?: string): string {
  const lbl = label?.trim();
  const href = url?.trim();
  if (!lbl && !href) return '—';
  if (lbl && href) return `${lbl}: ${href}`;
  return lbl || href || '—';
}
