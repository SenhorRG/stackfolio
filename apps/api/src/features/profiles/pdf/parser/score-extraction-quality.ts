import type { ProfileIdentity } from '@stackfolio/shared';

export function isMinimalExtraction(
  identity: ProfileIdentity,
  skillCount: number,
  suggestedProfileName?: string,
): boolean {
  const hasContact = Boolean(
    identity.contact.email ||
      identity.contact.phone ||
      identity.contact.location,
  );
  const hasIdentity =
    Boolean(identity.jobTitle?.trim()) ||
    Boolean(suggestedProfileName) ||
    Boolean(identity.summary?.trim());
  const hasSections =
    identity.experience.length > 0 ||
    identity.education.length > 0 ||
    skillCount > 0 ||
    identity.languages.length > 0 ||
    identity.certificates.length > 0 ||
    identity.projects.length > 0;

  return !hasContact && !hasIdentity && !hasSections;
}
