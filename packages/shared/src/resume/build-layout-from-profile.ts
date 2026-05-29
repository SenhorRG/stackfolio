import { DEFAULT_SECTION_ORDER } from '../enums/resume-section';
import {
  parseProfileIdentity,
  type ProfileIdentity,
} from '../entities/profile-identity';
import { createDefaultPages } from './pages';
import { resolveProfilePersonName } from '../profiles/resolve-profile-person-name';
import type { JsonLayoutShape, ProfileResumeSource } from './layout-types';
import { spacingPresetToTypography } from './theme';

function identityOf(profile: ProfileResumeSource): ProfileIdentity {
  return profile.identity ?? parseProfileIdentity(profile.profileData);
}

export function buildResumeLayoutFromProfile(
  profile: ProfileResumeSource,
  spacing = 'normal',
): JsonLayoutShape {
  const identity = identityOf(profile);
  const pages = createDefaultPages(DEFAULT_SECTION_ORDER);
  return {
    theme: spacingPresetToTypography(spacing),
    pages,
    sections: {
      header: {
        source: 'profile',
        fullName: resolveProfilePersonName(profile),
        title:
          identity.jobTitle?.trim() ||
          identity.experience[0]?.role?.trim() ||
          '',
        email: identity.contact.email ?? '',
        phone: identity.contact.phone ?? '',
        location: identity.contact.location ?? '',
        align: 'left',
      },
      summary: {
        source: 'profile',
        text: identity.summary || 'Professional summary goes here.',
      },
      skills: {
        source: 'profile',
        display: 'comma',
      },
      experience: {
        source: identity.experience.length ? 'profile' : 'custom',
        items: identity.experience,
      },
      education: {
        source: identity.education.length ? 'profile' : 'custom',
        items: identity.education,
      },
      projects: {
        source: identity.projects.length ? 'profile' : 'custom',
        items: identity.projects,
      },
      certifications: {
        source: identity.certificates.length ? 'profile' : 'custom',
        items: identity.certificates,
      },
      languages: {
        source: identity.languages.length ? 'profile' : 'custom',
        items: identity.languages,
      },
      links: {
        source: identity.links.length ? 'profile' : 'custom',
        items: identity.links,
      },
    },
  };
}

export function mergeProfileIntoLayout(
  layout: JsonLayoutShape,
  profile: ProfileResumeSource,
): JsonLayoutShape {
  const identity = identityOf(profile);
  const sections = { ...layout.sections };

  if (sections.skills?.source !== 'custom') {
    sections.skills = {
      ...sections.skills,
      source: 'profile',
      display: 'comma',
    };
  }

  if (sections.summary?.source !== 'custom' && identity.summary) {
    sections.summary = {
      ...sections.summary,
      source: 'profile',
      text: identity.summary,
    };
  }

  if (sections.header?.source !== 'custom') {
    const profileTitle =
      identity.jobTitle?.trim() ||
      identity.experience[0]?.role?.trim() ||
      '';
    sections.header = {
      ...sections.header,
      source: 'profile',
      fullName: resolveProfilePersonName(profile),
      title: profileTitle || sections.header?.title || '',
      email: identity.contact.email ?? sections.header?.email ?? '',
      phone: identity.contact.phone ?? sections.header?.phone ?? '',
      location: identity.contact.location ?? sections.header?.location ?? '',
    };
  }

  const profileBacked: Array<
    [keyof JsonLayoutShape['sections'], ProfileIdentity[keyof ProfileIdentity]]
  > = [
    ['experience', identity.experience],
    ['education', identity.education],
    ['projects', identity.projects],
    ['certifications', identity.certificates],
    ['languages', identity.languages],
    ['links', identity.links],
  ];

  for (const [key, items] of profileBacked) {
    if (!Array.isArray(items) || !items.length) continue;
    const section = sections[key];
    if (section?.source === 'custom') continue;
    sections[key] = { ...section, source: 'profile', items };
  }

  return { ...layout, sections };
}
