import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CONTENT_PACKING_SAFETY_PX,
  CV_PAGE_BODY_HEIGHT_PX,
  CV_PAGE_MARGIN_MM,
  coalesceSlicesForLayout,
  formatSkillCategoryLabel,
  joinCommaLineSkillTexts,
  buildSkillInlineParenthetical,
  reorderPageSlicesBySectionBlocks,
  shouldRenderSectionHeadingOnPage,
  ResumeSectionIdValue,
  ResumeSectionLabel,
  type SectionRenderSlice,
} from '@stackfolio/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mergeResumeDraft } from './merge-resume-draft';
import { prepareRenderLayout } from './page-layout';

type ResumeWithProfile = Prisma.ResumeProjectGetPayload<{
  include: {
    profile: {
      include: {
        skills: { include: { skill: true } };
      };
    };
  };
}>;

@Injectable()
export class CvPreviewRenderer {
  constructor(private readonly prisma: PrismaService) {}

  private async loadProject(projectId: string) {
    const project = await this.prisma.resumeProject.findUnique({
      where: { id: projectId },
      include: {
        profile: {
          include: {
            skills: {
              include: { skill: true },
              orderBy: { highlight: 'desc' },
            },
          },
        },
      },
    });
    if (!project) throw new NotFoundException('Resume project not found');
    return project;
  }

  async render(projectId: string, pageIndex?: number): Promise<string> {
    const project = await this.loadProject(projectId);
    return this.renderProject(project, pageIndex, false);
  }

  async renderForPdf(projectId: string): Promise<string> {
    const project = await this.loadProject(projectId);
    return this.renderProject(project, undefined, true);
  }

  async renderDraft(
    userId: string,
    projectId: string,
    draft: Record<string, unknown>,
    pageIndex?: number,
  ): Promise<string> {
    const project = await this.loadProject(projectId);
    if (project.profile.userId !== userId) {
      throw new ForbiddenException();
    }
    return this.renderProject(mergeResumeDraft(project, draft), pageIndex, false);
  }

  private renderProject(
    project: ResumeWithProfile,
    pageIndex?: number,
    pdfExport = false,
  ): string {
    const visibility = project.visibility as Record<string, boolean>;
    const {
      themeCss,
      headerAlign,
      pages,
      resolvedSections,
      legacyLineHeight,
      sectionOrder,
    } = prepareRenderLayout(project, {
        name: project.profile.name,
        profileData: project.profile.profileData,
        skills: project.profile.skills,
      });

    const headerContent = resolvedSections.get('header') ?? {};
    const divider =
      project.dividerStyle === 'none'
        ? ''
        : project.dividerStyle === 'dotted'
          ? 'border-bottom: 1px dotted #ccc;'
          : 'border-bottom: 1px solid #ddd;';

    const fontFamily =
      project.font === 'serif'
        ? 'Georgia, serif'
        : project.font === 'mono'
          ? 'ui-monospace, monospace'
          : 'Inter, system-ui, sans-serif';

    const cssVars = Object.entries(themeCss)
      .map(([k, v]) => `${k}: ${v};`)
      .join('\n      ');

    const visiblePages =
      pageIndex != null
        ? pages.filter((_, index) => index === pageIndex)
        : pages;

    const singlePageMode = pageIndex != null && !pdfExport;

    const pageBlocks = visiblePages
      .map((page) => {
        const resolvedPageIndex =
          pageIndex != null ? pageIndex : pages.indexOf(page);
        const bodySectionOrder = sectionOrder.filter(
          (id) => id !== 'header',
        );
        const slices: SectionRenderSlice[] = reorderPageSlicesBySectionBlocks(
          page.slices.length > 0
            ? page.slices.filter(
                (slice) => visibility[slice.sectionId] !== false,
              )
            : page.sectionIds
                .filter((id) => visibility[id] !== false)
                .map((sectionId) => ({
                  sectionId,
                  showHeading: true,
                })),
          bodySectionOrder,
        );

        const coalescedSlices = coalesceSlicesForLayout(slices);
        let lastSectionOnPage: ResumeSectionIdValue | null = null;
        const sections = coalescedSlices
          .map((slice) => {
            const isFirstSliceOfSectionOnPage =
              slice.sectionId !== lastSectionOnPage;
            lastSectionOnPage = slice.sectionId;
            return this.renderSectionSlice(
              slice,
              resolvedSections.get(slice.sectionId) ?? {},
              divider,
              isFirstSliceOfSectionOnPage,
            );
          })
          .filter(Boolean)
          .join('\n');
        const header =
          resolvedPageIndex === 0
            ? this.renderHeader(headerContent, headerAlign)
            : '';
        if (pdfExport && !header && !sections.trim()) {
          return '';
        }
        return `<div class="cv-page" data-page="${this.escape(page.id ?? `page-${resolvedPageIndex + 1}`)}"><div class="cv-page-body">${header}${sections}</div></div>`;
      })
      .filter(Boolean)
      .join('\n');

    const bodyClass = singlePageMode
      ? `theme-${this.escape(project.theme ?? 'classic')} cv-preview cv-preview--embed`
      : pdfExport
        ? `theme-${this.escape(project.theme ?? 'classic')} cv-preview cv-preview--pdf`
        : `theme-${this.escape(project.theme ?? 'classic')} cv-preview cv-preview--full`;

    const documentMarkup = singlePageMode
      ? pageBlocks
      : `<div class="cv-document">${pageBlocks}</div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${this.escape(project.name ?? 'Resume')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      ${singlePageMode ? 'width: 210mm; height: 297mm; overflow: hidden;' : 'min-height: 100%;'}
    }
    :root {
      ${cssVars}
    }
    body {
      font-family: ${fontFamily};
      font-size: var(--cv-font-size, 11pt);
      line-height: var(--cv-line-height, ${legacyLineHeight});
      color: #111;
      margin: 0;
      ${singlePageMode
        ? `
      background: #fff;
      padding: 0;
      width: 210mm;
      height: 297mm;
      overflow: hidden;`
        : `
      /* background: #5c6370; */
      min-height: 100vh;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 2rem 1rem 3rem;`}
    }
    body.cv-preview--full {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .cv-document {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 210mm;
      gap: 1.5rem;
    }
    .cv-page {
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      height: 297mm;
      margin: 0;
      padding: ${CV_PAGE_MARGIN_MM}mm;
      box-sizing: border-box;
      background: #fff;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      flex-shrink: 0;
      box-shadow: ${singlePageMode
        ? 'none'
        : '0 8px 28px rgba(15, 23, 42, 0.28), 0 2px 8px rgba(15, 23, 42, 0.12)'};
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }
    .cv-page-body {
      flex: 1 1 auto;
      min-height: 0;
      max-height: ${CV_PAGE_BODY_HEIGHT_PX}px;
      overflow: hidden;
      padding-bottom: ${CONTENT_PACKING_SAFETY_PX}px;
      box-sizing: border-box;
    }
    .cv-page:last-child { margin-bottom: 0; }
    .theme-classic h1 { font-size: 1.5em; }
    .theme-modern h1 { font-size: 1.75em; letter-spacing: -0.02em; }
    section#header,
    section.cv-section-part:not(.cv-section-continued) {
      page-break-inside: avoid;
    }
    section.cv-section-part + section.cv-section-part:not(.cv-section-continued) {
      margin-top: var(--cv-section-gap, 12pt);
    }
    section.cv-section-part + section.cv-section-part.cv-section-continued {
      margin-top: calc(var(--cv-line-height, 14pt) * 0.15);
    }
    section.cv-section-continued {
      margin-top: 0;
      margin-bottom: 0;
    }
    h2 {
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0.35em;
      margin-bottom: 0.4em;
      ${divider}
      padding-bottom: 0.25em;
    }
    section.cv-section-part:first-of-type h2 {
      margin-top: 0;
    }
    ul { margin: 0; padding-left: 1.25rem; }
    .cv-list,
    .cv-list ul,
    .cv-list-continued {
      margin: 0;
      padding-left: 1.25rem;
      list-style: disc;
    }
    .cv-list > li,
    .cv-list ul > li,
    .cv-list-continued > li {
      margin: 0 0 0.12em;
      padding: 0;
      line-height: inherit;
    }
    .cv-list > li:last-child,
    .cv-list ul > li:last-child,
    .cv-list-continued > li:last-child {
      margin-bottom: 0;
    }
    section.cv-section-part > h2 + .cv-list,
    section.cv-section-part > h2 + .cv-list-continued {
      margin-top: 0;
    }
    .cv-list > li > ul,
    .cv-item-continued > ul {
      margin-top: 0;
      padding-top: 0;
    }
    .cv-list-continued { list-style: disc; }
    .cv-item-continued { list-style: none; }
    .cv-item-continued > ul {
      list-style: disc;
    }
    .cv-list-skills { margin-top: 0; }
    .cv-list-skills > li > ul { list-style: none; padding-left: 0; margin-top: 0.15em; }
    .cv-block-list,
    .cv-link-list,
    .cv-skills-block {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .cv-entry,
    .cv-link-item,
    .cv-skill-line {
      margin: 0 0 0.12em;
      padding: 0;
      line-height: inherit;
    }
    .cv-entry:last-child,
    .cv-link-item:last-child,
    .cv-skill-line:last-child {
      margin-bottom: 0;
    }
    .cv-entry-header { margin: 0; }
    .cv-list-nested {
      margin: 0.15em 0 0;
      padding-left: 1.25rem;
      list-style: disc;
    }
    .cv-list-nested > li {
      margin: 0 0 0.12em;
      padding: 0;
    }
    .header-links {
      margin-top: 0.15em;
    }
    .cv-skill-comma-continued {
      margin: 0 0 0.12em;
      padding-left: 1.25rem;
      line-height: inherit;
      list-style: none;
    }
    section.cv-section-part + section.cv-section-part .cv-skill-comma-continued {
      margin-top: 0;
    }
    .item-meta { font-size: 0.9em; color: #444; margin: 0.1em 0 0.2em; }
    .item-desc { margin: 0.15em 0 0; white-space: pre-wrap; line-height: 1.35; }
    .item-sub { font-weight: normal; color: #333; }
    .header-left { text-align: left; }
    .header-center { text-align: center; }
    .header-right { text-align: right; }
    body.cv-preview--pdf,
    body.cv-preview--pdf .cv-document {
      display: block;
      width: 210mm;
      min-height: auto;
      padding: 0;
      margin: 0;
      background: #fff;
      overflow: visible;
    }
    body.cv-preview--pdf .cv-document {
      max-width: none;
      gap: 0;
    }
    body.cv-preview--pdf .cv-page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      margin: 0;
      padding: ${CV_PAGE_MARGIN_MM}mm;
      overflow: visible;
      box-shadow: none;
      page-break-after: always;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    body.cv-preview--pdf .cv-page:last-child {
      page-break-after: auto;
    }
    body.cv-preview--pdf .cv-page-body {
      overflow: visible;
      max-height: none;
      height: auto;
      min-height: 0;
      flex: 1 1 auto;
    }
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      html, body {
        width: 210mm;
        height: auto;
        overflow: visible;
      }
      body {
        background: #fff;
        padding: 0;
      }
      body.cv-preview--full {
        display: block;
      }
      body.cv-preview--pdf,
      body.cv-preview--pdf .cv-document {
        display: block;
        width: 210mm;
        padding: 0;
        margin: 0;
        gap: 0;
      }
      .cv-document {
        gap: 0;
        max-width: none;
        width: 210mm;
      }
      .cv-page {
        box-shadow: none;
        margin: 0;
        width: 210mm;
        height: 297mm;
        min-height: 297mm;
        max-height: 297mm;
        overflow: visible;
        page-break-after: always;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .cv-page:last-child {
        page-break-after: auto;
      }
      .cv-page-body {
        overflow: visible;
        max-height: none;
        height: auto;
      }
    }
  </style>
</head>
<body class="${bodyClass}">
  ${documentMarkup}
</body>
<script>
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: 'stackfolio-cv-preview', pageCount: ${pages.length} },
      '*'
    );
  }
</script>
</html>`;
  }

  private renderHeader(
    content: Record<string, unknown>,
    align: 'left' | 'center' | 'right',
  ): string {
    const fullName = this.escape(String(content.fullName ?? 'Your Name'));
    const title = this.escape(String(content.title ?? ''));
    const email = this.escape(String(content.email ?? ''));
    const phone = this.escape(String(content.phone ?? ''));
    const location = this.escape(String(content.location ?? ''));
    const contactLine = [email, phone, location].filter(Boolean).join(' · ');
    const headerLinks = (content.headerLinks as string[] | undefined) ?? [];
    const linksLine = headerLinks.length
      ? `<p class="header-links">${headerLinks.map((link) => this.escape(link)).join(' · ')}</p>`
      : '';
    return `<section id="header" class="header-${align}"><h1>${fullName}</h1>${title ? `<p>${title}</p>` : ''}${contactLine ? `<p>${contactLine}</p>` : ''}${linksLine}</section>`;
  }

  private usesBlockEntries(sectionId: ResumeSectionIdValue): boolean {
    return (
      sectionId === 'experience' ||
      sectionId === 'education' ||
      sectionId === 'projects' ||
      sectionId === 'links'
    );
  }

  private wrapSectionBody(
    sectionId: ResumeSectionIdValue,
    h2: string,
    sectionClass: string,
    bodyHtml: string,
  ): string {
    if (!bodyHtml.trim()) return '';
    return `<section id="${sectionId}" class="${sectionClass}">${h2}${bodyHtml}</section>`;
  }

  private renderSectionSlice(
    slice: SectionRenderSlice,
    content: Record<string, unknown>,
    divider: string,
    isFirstSliceOfSectionOnPage: boolean,
  ): string {
    const sectionId = slice.sectionId;
    const label = this.escape(
      String(content.sectionTitle ?? ResumeSectionLabel[sectionId] ?? sectionId),
    );
    const renderHeading = shouldRenderSectionHeadingOnPage(
      slice,
      isFirstSliceOfSectionOnPage,
    );
    const h2 = renderHeading
      ? `<h2 style="${divider} margin-top: 0.8rem;">${label}</h2>`
      : '';
    const continued = renderHeading ? '' : ' cv-section-continued';
    const sectionClass = `cv-section-part${continued}`;

    switch (sectionId) {
      case 'summary':
        return `<section id="summary" class="${sectionClass}">${h2}<p>${this.escape(String(content.text ?? ''))}</p></section>`;
      case 'skills': {
        const categories =
          (content.categories as Array<Record<string, unknown>>) ?? [];
        const showBullets = content.showBullets !== false;
        const formatOptions = {
          showLevel: content.skillShowLevel !== false,
          showYears: content.skillShowYears !== false,
        };
        const catStart = slice.categoryStart ?? 0;
        const catEnd = slice.categoryEnd ?? categories.length;
        if (categories.length) {
          const blocks = categories
            .slice(catStart, catEnd)
            .map((group) =>
              this.renderSkillCategory(
                group,
                slice.skillBatchStart,
                slice.skillBatchEnd,
                slice.skillBatchStart == null || slice.skillBatchStart === 0,
                slice.commaLineParts,
                formatOptions,
                showBullets,
              ),
            )
            .join('');
          if (!blocks.trim()) return '';
          return `<section id="skills" class="${sectionClass}">${h2}${blocks}</section>`;
        }
        const items = (content.items as Array<Record<string, unknown>>) ?? [];
        const batchStart = slice.skillBatchStart ?? 0;
        const batchEnd = slice.skillBatchEnd ?? items.length;
        const batchItems = items.slice(batchStart, batchEnd);
        const pseudo = {
          label: '',
          display: 'comma',
          skills: batchItems,
        };
        const line = this.renderSkillCategory(
          pseudo,
          undefined,
          undefined,
          true,
          slice.commaLineParts,
          formatOptions,
          showBullets,
        );
        return `<section id="skills" class="${sectionClass}">${h2}${line}</section>`;
      }
      case 'experience':
      case 'education':
      case 'projects':
      case 'certifications':
      case 'languages':
      case 'links': {
        const items = (content.items as Array<Record<string, unknown>>) ?? [];
        const itemIndex = slice.itemStart ?? 0;
        const item = items[itemIndex];
        if (!item) return '';

        if (slice.part === 'header') {
          const headerHtml = this.renderListItemHeader(sectionId, item);
          const body = this.usesBlockEntries(sectionId)
            ? `<div class="cv-block-list"><div class="cv-entry"><div class="cv-entry-header">${headerHtml}</div></div></div>`
            : `<ul class="cv-list"><li>${headerHtml}</li></ul>`;
          return this.wrapSectionBody(sectionId, h2, sectionClass, body);
        }

        if (slice.part === 'bullet' && slice.bulletIndex != null) {
          const bullets = this.getItemBullets(item);
          const line = bullets[slice.bulletIndex];
          if (!line) return '';
          const body =
            sectionId === 'projects'
              ? `<p class="item-desc">${this.escape(line)}</p>`
              : `<ul class="cv-list-nested"><li>${this.escape(line)}</li></ul>`;
          return this.wrapSectionBody(sectionId, h2, sectionClass, body);
        }

        const start = slice.itemStart ?? 0;
        const end = slice.itemEnd ?? items.length;
        const subset = items.slice(start, end);
        if (!subset.length) return '';
        const list = subset
          .map((row) => this.renderListItem(sectionId, row))
          .join('');
        const body = this.usesBlockEntries(sectionId)
          ? `<div class="${sectionId === 'links' ? 'cv-link-list' : 'cv-block-list'}">${list}</div>`
          : `<ul class="cv-list">${list}</ul>`;
        return this.wrapSectionBody(sectionId, h2, sectionClass, body);
      }
      default:
        return renderHeading
          ? `<section id="${sectionId}" class="${sectionClass}">${h2}</section>`
          : '';
    }
  }

  private formatSkillInline(
    item: Record<string, unknown>,
    options?: { showLevel?: boolean; showYears?: boolean },
  ): string {
    const name = this.escape(String(item.name ?? item.skillSlug ?? ''));
    const suffix = buildSkillInlineParenthetical(
      {
        level: item.level ? String(item.level) : undefined,
        years:
          item.years != null && item.years !== ''
            ? Number(item.years)
            : null,
      },
      options,
    );
    return `${name}${suffix}`;
  }

  private renderSkillCategory(
    group: Record<string, unknown>,
    skillBatchStart?: number,
    skillBatchEnd?: number,
    showCategoryLabel = true,
    commaLineParts?: SectionRenderSlice['commaLineParts'],
    formatOptions?: { showLevel?: boolean; showYears?: boolean },
    showBullets = true,
  ): string {
    const rawLabel = String(group.label ?? group.key ?? '');
    const label = this.escape(formatSkillCategoryLabel(rawLabel));
    const allSkills = (group.skills as Array<Record<string, unknown>>) ?? [];
    const start = skillBatchStart ?? 0;
    const end = skillBatchEnd ?? allSkills.length;

    const batches =
      commaLineParts ??
      (end > start ? [{ skillBatchStart: start, skillBatchEnd: end }] : []);
    const lines = batches
      .map(
        (
          batch: { skillBatchStart: number; skillBatchEnd: number },
          batchIndex: number,
        ) => {
          const skillTexts = allSkills
            .slice(batch.skillBatchStart, batch.skillBatchEnd)
            .map((s) => this.formatSkillInline(s, formatOptions));
          return joinCommaLineSkillTexts(skillTexts, {
            trailingComma: batchIndex < batches.length - 1,
          });
        },
      )
      .filter((line: string) => line.length > 0);
    if (!lines.length) return '';

    const body = lines.join('<br/>');
    const isContinuationOnly =
      !commaLineParts &&
      showCategoryLabel === false &&
      start > 0 &&
      Boolean(label);

    if (isContinuationOnly) {
      return `<div class="cv-skill-comma-continued">${body}</div>`;
    }
    if (!showBullets) {
      if (!showCategoryLabel || !label) {
        return `<div class="cv-skills-block"><div class="cv-skill-line">${body}</div></div>`;
      }
      return `<div class="cv-skills-block"><div class="cv-skill-line"><strong>${label}</strong>: ${body}</div></div>`;
    }
    if (!showCategoryLabel || !label) {
      return `<ul class="cv-list cv-list-skills"><li>${body}</li></ul>`;
    }
    return `<ul class="cv-list cv-list-skills"><li><strong>${label}</strong>: ${body}</li></ul>`;
  }

  private getItemBullets(item: Record<string, unknown>): string[] {
    const bullets = (item.bullets as string[] | undefined)?.filter(Boolean) ?? [];
    if (bullets.length) return bullets;
    const description = String(item.description ?? '').trim();
    if (!description) return [];
    return description
      .split(/\n+/)
      .map((line) => line.replace(/^[\s•\-*]+\s*/, '').trim())
      .filter(Boolean);
  }

  private renderListItemHeader(
    sectionId: ResumeSectionIdValue,
    item: Record<string, unknown>,
  ): string {
    const meta = this.escape(String(item.period ?? item.date ?? ''));
    const metaHtml = meta ? `<div class="item-meta">${meta}</div>` : '';

    if (sectionId === 'experience') {
      const company = this.escape(String(item.company ?? ''));
      const role = this.escape(String(item.role ?? ''));
      const roleHtml = role ? `<span class="item-sub"> — ${role}</span>` : '';
      return `<strong>${company}</strong>${roleHtml}${metaHtml}`;
    }

    if (sectionId === 'education') {
      const institution = this.escape(String(item.institution ?? ''));
      const degree = this.escape(String(item.degree ?? ''));
      const degreeHtml = degree ? `<span class="item-sub"> — ${degree}</span>` : '';
      return `<strong>${institution}</strong>${degreeHtml}${metaHtml}`;
    }

    if (sectionId === 'projects') {
      const name = this.escape(String(item.name ?? ''));
      const url = String(item.url ?? '').trim();
      const urlHtml = url ? `<div class="item-meta">${this.escape(url)}</div>` : '';
      return `<strong>${name}</strong>${urlHtml}${metaHtml}`;
    }

    return this.escape(String(item.name ?? item.company ?? ''));
  }

  private renderProjectsBody(
    item: Record<string, unknown>,
  ): string {
    const description = String(item.description ?? '').trim();
    const bullets = this.getItemBullets(item);
    if (description) {
      return `<p class="item-desc">${this.escape(description)}</p>`;
    }
    if (bullets.length) {
      return `<p class="item-desc">${bullets.map((line) => this.escape(line)).join('<br/>')}</p>`;
    }
    return '';
  }

  private renderExperienceBody(
    item: Record<string, unknown>,
  ): string {
    const description = String(item.description ?? '').trim();
    const bullets = this.getItemBullets(item);
    if (bullets.length) {
      return `<ul class="cv-list-nested">${bullets.map((b) => `<li>${this.escape(b)}</li>`).join('')}</ul>`;
    }
    if (description) {
      return `<p class="item-desc">${this.escape(description)}</p>`;
    }
    return '';
  }

  private renderListItem(
    sectionId: ResumeSectionIdValue,
    item: Record<string, unknown>,
  ): string {
    const meta = this.escape(
      String(item.period ?? item.date ?? ''),
    );
    const metaHtml = meta ? `<div class="item-meta">${meta}</div>` : '';

    if (sectionId === 'languages') {
      const name = this.escape(String(item.name ?? ''));
      const level = this.escape(String(item.level ?? ''));
      const line = level ? `${name} — ${level}` : name;
      return `<li>${line}</li>`;
    }

    if (sectionId === 'links') {
      const label = this.escape(String(item.label ?? ''));
      const url = this.escape(String(item.url ?? ''));
      const line = label ? `${label}: ${url}` : url;
      return `<div class="cv-link-item">${line}</div>`;
    }

    if (sectionId === 'experience') {
      const company = this.escape(String(item.company ?? ''));
      const role = this.escape(String(item.role ?? ''));
      const roleHtml = role
        ? `<span class="item-sub"> — ${role}</span>`
        : '';
      const bodyHtml = this.renderExperienceBody(item);
      return `<div class="cv-entry"><div class="cv-entry-header"><strong>${company}</strong>${roleHtml}${metaHtml}</div>${bodyHtml}</div>`;
    }

    if (sectionId === 'education') {
      const institution = this.escape(String(item.institution ?? ''));
      const degree = this.escape(String(item.degree ?? ''));
      const degreeHtml = degree
        ? `<span class="item-sub"> — ${degree}</span>`
        : '';
      const bodyHtml = this.renderProjectsBody(item);
      return `<div class="cv-entry"><div class="cv-entry-header"><strong>${institution}</strong>${degreeHtml}${metaHtml}</div>${bodyHtml}</div>`;
    }

    if (sectionId === 'projects') {
      const name = this.escape(String(item.name ?? ''));
      const url = String(item.url ?? '').trim();
      const urlHtml = url
        ? `<div class="item-meta">${this.escape(url)}</div>`
        : '';
      const bodyHtml = this.renderProjectsBody(item);
      return `<div class="cv-entry"><strong>${name}</strong>${urlHtml}${metaHtml}${bodyHtml}</div>`;
    }

    if (sectionId === 'certifications') {
      const name = this.escape(String(item.name ?? ''));
      const issuer = this.escape(String(item.issuer ?? ''));
      const issuerHtml = issuer
        ? `<span class="item-sub"> — ${issuer}</span>`
        : '';
      return `<li><strong>${name}</strong>${issuerHtml}${metaHtml}</li>`;
    }

    const description = String(item.description ?? '').trim();
    const bullets = this.getItemBullets(item);
    const bodyHtml = bullets.length
      ? `<ul class="cv-list-nested">${bullets.map((b) => `<li>${this.escape(b)}</li>`).join('')}</ul>`
      : description
        ? `<p class="item-desc">${this.escape(description)}</p>`
        : '';
    return `<li>${bodyHtml}</li>`;
  }

  private escape(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
