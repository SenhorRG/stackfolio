import type { ResumeSectionLayoutConfig } from './layout-types';

export type LinksPlacement = 'section' | 'header';

export function resolveLinksPlacement(
  config: ResumeSectionLayoutConfig | undefined,
): LinksPlacement {
  return config?.linksPlacement === 'header' ? 'header' : 'section';
}

export function resolveSkillsShowBullets(
  config: ResumeSectionLayoutConfig | undefined,
): boolean {
  return config?.showBullets !== false;
}

function stripUrlProtocol(url: string): string {
  return url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

function dedupeEmbeddedHost(value: string): string {
  const duplicateHost = value.match(
    /^([a-z0-9](?:[a-z0-9-]*\.)+[a-z]{2,})\/\1(\/.*)?$/i,
  );
  if (!duplicateHost) return value;
  return duplicateHost[1]! + (duplicateHost[2] ?? '');
}

export function formatLinkUrlForDisplay(url: string): string {
  const stripped = stripUrlProtocol(url);
  if (!stripped) return '';
  return dedupeEmbeddedHost(stripped);
}

export function normalizeLinkUrl(raw: string, host: string): string {
  const trimmed = raw.replace(/[|,]+$/, '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const hostRoot = stripUrlProtocol(host).replace(/\/+$/, '');
  const path = stripUrlProtocol(trimmed).replace(/^\/+/, '');

  if (path.toLowerCase().startsWith(`${hostRoot.toLowerCase()}/`) || path.toLowerCase() === hostRoot.toLowerCase()) {
    return `https://${path}`;
  }

  return `https://${hostRoot}/${path.replace(/^\/+/, '')}`;
}

export function resolveHeaderLinkUrls(
  items: Array<{ label?: string; url?: string }>,
): string[] {
  return items
    .map((item) => formatLinkUrlForDisplay(String(item.url ?? '')))
    .filter(Boolean);
}
