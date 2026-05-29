import type { ProfileIdentity } from '@stackfolio/shared';
import { normalizeLinkUrl } from '@stackfolio/shared';

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE =
  /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,3}\)[\s.-]?)?\d[\d\s().-]{6,}\d/;
const LINKEDIN_RE =
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)|,]+/gi;
const GITHUB_RE =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)|,]+/gi;
const GENERIC_URL_RE = /https?:\/\/[^\s)|,]+/gi;
const LABELED_LINK_RE =
  /^(.+?):\s*((?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)|,]+)?)\s*$/i;
const LOCATION_LABEL_RE =
  /^(location|localização|localizacao|endereço|endereco|city|cidade)\s*:\s*(.+)$/i;

function normalizeBrokenEmails(raw: string): string {
  return raw
    .replace(/([^\s@]+@hotmail)\.\s+com\b/gi, '$1.com')
    .replace(/([^\s@]+@[^\s@]+)\.\s*\n\s*com\b/gi, '$1.com');
}

function joinBrokenEmailLines(lines: string[]): string {
  return normalizeBrokenEmails(
    lines
      .slice(0, 30)
      .join(' ')
      .replace(/\s+/g, ' '),
  );
}

function hostForNormalize(rawUrl: string): string {
  const match = rawUrl
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .match(/^([a-z0-9.-]+\.[a-z]{2,})/i);
  return match?.[1] ?? '';
}

function looksLikeUrl(value: string): boolean {
  return /^(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}/i.test(
    value.trim(),
  );
}

function appendLink(
  links: ProfileIdentity['links'],
  seenUrls: Set<string>,
  label: string,
  rawUrl: string,
) {
  const host = hostForNormalize(rawUrl);
  if (!host) return;
  const url = normalizeLinkUrl(rawUrl, host);
  if (!url || seenUrls.has(url)) return;
  seenUrls.add(url);
  links.push({ label: label.trim(), url });
}

function extractLabeledLinksFromLines(
  lines: string[],
  links: ProfileIdentity['links'],
  seenUrls: Set<string>,
) {
  for (const line of lines.slice(0, 25)) {
    const match = line.trim().match(LABELED_LINK_RE);
    if (!match?.[1] || !match[2] || !looksLikeUrl(match[2])) continue;
    appendLink(links, seenUrls, match[1], match[2]);
  }
}

function extractBareUrlsFromText(
  text: string,
  links: ProfileIdentity['links'],
  seenUrls: Set<string>,
) {
  for (const pattern of [LINKEDIN_RE, GITHUB_RE, GENERIC_URL_RE]) {
    const matches = text.match(pattern) ?? [];
    for (const rawUrl of matches) {
      appendLink(links, seenUrls, '', rawUrl);
    }
  }
}

export function extractContactFromText(
  text: string,
  lines: string[],
): Pick<ProfileIdentity, 'contact' | 'links'> {
  const contact: ProfileIdentity['contact'] = {};
  const links: ProfileIdentity['links'] = [];
  const seenUrls = new Set<string>();

  const joinedTop = joinBrokenEmailLines(lines);
  const searchable = normalizeBrokenEmails(
    (joinedTop + '\n' + text).replace(/\|/g, ' '),
  );
  const emailMatch = searchable.match(EMAIL_RE);
  if (emailMatch) {
    contact.email = emailMatch[0].replace(/\|$/, '').trim();
  }

  const phoneMatch = text.match(PHONE_RE);
  if (phoneMatch) {
    const phone = phoneMatch[0].trim();
    if (!/^\d{5}-?\d{3}$/.test(phone.replace(/\D/g, ''))) {
      contact.phone = phone;
    }
  }

  for (const line of lines.slice(0, 25)) {
    const loc = line.match(LOCATION_LABEL_RE);
    if (loc?.[2]) {
      contact.location = loc[2].trim().slice(0, 120);
      break;
    }
  }

  extractLabeledLinksFromLines(lines, links, seenUrls);
  extractBareUrlsFromText(text, links, seenUrls);

  return { contact, links };
}

export function isContactOrMetaLine(line: string): boolean {
  if (EMAIL_RE.test(line)) return true;
  if (PHONE_RE.test(line)) return true;
  if (/^https?:\/\//i.test(line)) return true;
  if (LOCATION_LABEL_RE.test(line)) return true;
  if (/^(email|e-mail|phone|telefone|tel|cel)\s*:/i.test(line)) return true;
  if (/linkedin\.com|github\.com/i.test(line)) return true;
  if (/^\|+$/.test(line.trim())) return true;
  return false;
}
