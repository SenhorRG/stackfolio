import type { ProfileIdentity } from '../entities/profile-identity';

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function identityHasContent(identity: ProfileIdentity | null | undefined): boolean {
  if (!identity) return false;
  if (hasText(identity.jobTitle) || hasText(identity.summary)) return true;
  const contact = identity.contact ?? {};
  if (
    hasText(contact.email) ||
    hasText(contact.phone) ||
    hasText(contact.location)
  ) {
    return true;
  }
  const lists = [
    identity.experience,
    identity.education,
    identity.certificates,
    identity.projects,
    identity.links,
    identity.languages,
  ];
  return lists.some((items) =>
    items.some((item) =>
      Object.values(item).some(
        (v) => typeof v === 'string' && hasText(v),
      ),
    ),
  );
}

export function profileHasFilledData(params: {
  profileData: unknown;
  skillsCount: number;
  parseIdentity: (data: unknown) => ProfileIdentity;
}): boolean {
  if (params.skillsCount > 0) return true;
  const identity = params.parseIdentity(params.profileData);
  return identityHasContent(identity);
}
