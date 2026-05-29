import { BadRequestException, Injectable } from '@nestjs/common';
import { validateProfileIdentity, type ParsedProfileFromPdf } from '@stackfolio/shared';
import { SkillsService } from '../../skills/skills.service';
import { extractProfileFromResumeText } from './extract-profile-from-resume-text';
import { extractTextFromPdfBuffer } from './extract-text-from-pdf-buffer';

const MAX_PDF_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ProfilePdfImportService {
  constructor(private readonly skillsService: SkillsService) {}

  assertPdfFile(file: Express.Multer.File | undefined): Buffer {
    if (!file?.buffer?.length) {
      throw new BadRequestException('PDF file is required');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only application/pdf files are supported');
    }
    if (file.size > MAX_PDF_BYTES) {
      throw new BadRequestException('PDF must be 5 MB or smaller');
    }
    return file.buffer;
  }

  async parsePdfBuffer(buffer: Buffer): Promise<ParsedProfileFromPdf> {
    const text = await extractTextFromPdfBuffer(buffer);
    const parsed = extractProfileFromResumeText(text);
    const validation = validateProfileIdentity(parsed.identity);
    if (!validation.success) {
      throw new BadRequestException({
        message: 'Extracted profile data failed validation',
        errors: validation.fieldErrors,
      });
    }
    return {
      ...parsed,
      identity: validation.data!,
    };
  }

  async resolveSkillIds(skillNames: string[]): Promise<{
    skillIds: string[];
    warnings: string[];
  }> {
    const ids: string[] = [];
    const skipped: string[] = [];
    for (const name of skillNames) {
      const skill = await this.skillsService.findExistingByName(name);
      if (skill) {
        if (!ids.includes(skill.id)) ids.push(skill.id);
      } else {
        skipped.push(name);
      }
    }
    const warnings: string[] = [];
    if (skipped.length > 0) {
      const preview = skipped.slice(0, 8).join(', ');
      const suffix =
        skipped.length > 8 ? ` (+${skipped.length - 8} more)` : '';
      warnings.push(
        `${skipped.length} skill(s) from the PDF are not in the catalog and were not added: ${preview}${suffix}.`,
      );
    }
    return { skillIds: ids, warnings };
  }

}
