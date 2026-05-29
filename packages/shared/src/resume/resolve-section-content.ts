import type { ResumeSectionIdValue } from '../enums/resume-section';
import {
  parseProfileIdentity,
  type ProfileIdentity,
} from '../entities/profile-identity';
import { descriptionToBullets } from '../profiles/description-to-bullets';
import {
  buildSkillsCategoryGroups,
  enrichSkillItemsFromProfile,
  normalizeSkillsDisplay,
  profileSkillItems,
} from './skills-by-category';
import {
  filterVisibleSkillCategoryGroups,
  resolveSkillInlineFormatOptions,
} from '../profiles/profile-skill-display-settings';
import { resolveProfilePersonName } from '../profiles/resolve-profile-person-name';
import type {
  HeaderAlign,
  JsonLayoutShape,
  ProfileResumeSource,
  ResumeSectionLayoutConfig,
  SectionDataSource,
} from './layout-types';
import {
  resolveHeaderLinkUrls,
  resolveLinksPlacement,
  resolveSkillsShowBullets,
} from './section-display-options';

function stripSectionMeta(config: ResumeSectionLayoutConfig) {
  const { source, overrides, align, sectionTitle, ...rest } = config;
  void source;
  void overrides;
  void align;
  void sectionTitle;
  return rest;
}

function resolveSectionHeading(
  config: ResumeSectionLayoutConfig,
): string | undefined {
  const custom = config.sectionTitle ?? config.title;
  return typeof custom === 'string' && custom.trim()
    ? custom.trim()
    : undefined;
}

function withSectionTitle(
  content: Record<string, unknown>,
  config: ResumeSectionLayoutConfig,
): Record<string, unknown> {
  const heading = resolveSectionHeading(config);
  if (heading) {
    return { ...content, sectionTitle: heading };
  }
  return content;
}

function profileIdentity(profile: ProfileResumeSource): ProfileIdentity {
  return profile.identity ?? parseProfileIdentity(profile.profileData);
}

export function getHeaderAlign(
  sections: JsonLayoutShape['sections'] | undefined,
): HeaderAlign {
  const align = sections?.header?.align;
  if (align === 'center' || align === 'right') return align;
  return 'left';
}

export function resolveSectionContent(
  sectionId: ResumeSectionIdValue,
  sections: JsonLayoutShape['sections'] | undefined,
  profile: ProfileResumeSource,
): Record<string, unknown> {
  const config = sections?.[sectionId] ?? {};
  const overrides = (config.overrides ?? {}) as Record<string, unknown>;
  const source = config.source ?? 'profile';
  const content = stripSectionMeta(config);
  const identity = profileIdentity(profile);

  switch (sectionId) {
    case 'header': {
      const headerCfg = sections?.header ?? {};
      const layoutTitle = String(headerCfg.title ?? '').trim();
      const profileJobTitle =
        String(identity.jobTitle ?? '').trim() ||
        identity.experience[0]?.role?.trim() ||
        '';
      const fromProfile = {
        fullName: resolveProfilePersonName(profile),
        title: layoutTitle || profileJobTitle,
        email: identity.contact.email ?? '',
        phone: identity.contact.phone ?? '',
        location: identity.contact.location ?? '',
      };
      const linksConfig = sections?.links ?? {};
      const linksPlacement = resolveLinksPlacement(linksConfig);
      const linkItems = resolveLinksItems(linksConfig, profile);
      const base =
        source === 'custom'
          ? { ...fromProfile, ...content, ...overrides }
          : { ...fromProfile, ...overrides, ...content };
      return withSectionTitle(
        {
          ...base,
          linksPlacement,
          ...(linksPlacement === 'header'
            ? { headerLinks: resolveHeaderLinkUrls(linkItems) }
            : {}),
        },
        config,
      );
    }
    case 'summary': {
      const text =
        source === 'custom'
          ? String(content.text ?? overrides.text ?? '')
          : String(
              overrides.text ??
                content.text ??
                identity.summary ??
                'Professional summary goes here.',
            );
      return withSectionTitle({ text }, config);
    }
    case 'skills': {
      const profileItems = profileSkillItems(profile);
      const rawItems =
        source === 'custom' && Array.isArray(content.items)
          ? enrichSkillItemsFromProfile(
              (overrides.items ?? content.items) as typeof profileItems,
              profile,
            )
          : profileItems;
      const displayMode = normalizeSkillsDisplay(
        overrides.display ?? content.display ?? config.display,
      );
      const categories = filterVisibleSkillCategoryGroups(
        buildSkillsCategoryGroups(
          rawItems,
          {
            ...config,
            display: displayMode,
          },
          identity.skillCategoryOrder,
        ),
        identity.hiddenSkillCategories,
      );
      const skillFormat = resolveSkillInlineFormatOptions(identity);
      return withSectionTitle(
        {
          display: displayMode,
          items: rawItems,
          categories,
          skillShowLevel: skillFormat.showLevel,
          skillShowYears: skillFormat.showYears,
          showBullets: resolveSkillsShowBullets(config),
        },
        config,
      );
    }
    case 'education':
      return withSectionTitle(
        resolveListSection(source, content, overrides, identity.education),
        config,
      );
    case 'projects':
      return withSectionTitle(
        resolveListSection(source, content, overrides, identity.projects),
        config,
      );
    case 'certifications':
      return withSectionTitle(
        resolveListSection(
          source,
          content,
          overrides,
          identity.certificates,
        ),
        config,
      );
    case 'languages':
      return withSectionTitle(
        resolveListSection(source, content, overrides, identity.languages),
        config,
      );
    case 'links': {
      const linksPlacement = resolveLinksPlacement(config);
      const resolved = resolveListSection(
        source,
        content,
        overrides,
        identity.links,
      );
      const items =
        linksPlacement === 'header'
          ? []
          : ((resolved.items as Array<Record<string, unknown>>) ?? []);
      return withSectionTitle(
        {
          ...resolved,
          items,
          linksPlacement,
        },
        config,
      );
    }
    case 'experience': {
      const raw = resolveListSection(
        source,
        content,
        overrides,
        identity.experience,
      );
      const items = ((raw.items as Array<Record<string, unknown>>) ?? []).map(
        (item) => {
          const bullets = item.bullets as string[] | undefined;
          const description = item.description as string | undefined;
          return {
            ...item,
            bullets:
              bullets?.length ? bullets : descriptionToBullets(description),
          };
        },
      );
      return withSectionTitle({ ...raw, items }, config);
    }
    default:
      return withSectionTitle(
        {
          items: [],
          ...content,
          ...overrides,
        },
        config,
      );
  }
}

function resolveListSection(
  source: SectionDataSource | undefined,
  content: Record<string, unknown>,
  overrides: Record<string, unknown>,
  profileItems: unknown[],
) {
  const items =
    source === 'custom' && Array.isArray(content.items)
      ? (overrides.items ?? content.items)
      : profileItems.length
        ? profileItems
        : (content.items ?? []);
  return { ...content, ...overrides, items };
}

function resolveLinksItems(
  config: ResumeSectionLayoutConfig,
  profile: ProfileResumeSource,
): Array<{ label?: string; url?: string }> {
  const source = config.source ?? 'profile';
  const overrides = (config.overrides ?? {}) as Record<string, unknown>;
  const content = config as Record<string, unknown>;
  const identity = profileIdentity(profile);
  const items =
    source === 'custom' && Array.isArray(content.items)
      ? (overrides.items ?? content.items)
      : identity.links;
  return (items as Array<{ label?: string; url?: string }>) ?? [];
}
