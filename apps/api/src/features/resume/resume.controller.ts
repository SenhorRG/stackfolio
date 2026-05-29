import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CvPreviewRenderer } from './cv-preview.renderer';
import { PdfService } from './pdf.service';
import { ResumeService } from './resume.service';

@Controller()
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly previewRenderer: CvPreviewRenderer,
    private readonly pdfService: PdfService,
  ) {}

  @Get('cv-preview/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async cvPreview(
    @Param('id') id: string,
    @Query('page') page: string | undefined,
    @Res() res: Response,
  ) {
    const pageIndex =
      page != null && page !== '' ? Math.max(0, parseInt(page, 10) || 0) : undefined;
    const html = await this.previewRenderer.render(id, pageIndex);
    res.send(html);
  }

  @Get('resume-projects/profile/:profileId')
  @UseGuards(JwtAuthGuard)
  listByProfile(
    @CurrentUser() user: { userId: string },
    @Param('profileId') profileId: string,
  ) {
    return this.resumeService.listForProfile(user.userId, profileId);
  }

  @Get('resume-projects/:id')
  @UseGuards(JwtAuthGuard)
  one(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.resumeService.getById(user.userId, id);
  }

  @Post('resume-projects')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: { userId: string },
    @Body()
    body: {
      profileId: string;
      name?: string;
      theme?: string;
      font?: string;
      spacing?: string;
    },
  ) {
    return this.resumeService.create(user.userId, body);
  }

  @Patch('resume-projects/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.resumeService.update(user.userId, id, body);
  }

  @Delete('resume-projects/:id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.resumeService.remove(user.userId, id);
  }

  @Post('resume-projects/:id/duplicate')
  @UseGuards(JwtAuthGuard)
  duplicate(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.resumeService.duplicate(user.userId, id);
  }

  @Post('resume-projects/:id/autofill')
  @UseGuards(JwtAuthGuard)
  autofill(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.resumeService.autofillFromProfile(user.userId, id);
  }

  @Post('resume-projects/:id/track-recent')
  @UseGuards(JwtAuthGuard)
  trackRecent(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.resumeService.trackRecent(user.userId, id);
  }

  @Post('resume-projects/:id/cv-preview')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/html; charset=utf-8')
  async cvPreviewDraft(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Query('page') page: string | undefined,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const pageIndex =
      page != null && page !== ''
        ? Math.max(0, parseInt(page, 10) || 0)
        : undefined;
    const html = await this.previewRenderer.renderDraft(
      user.userId,
      id,
      body,
      pageIndex,
    );
    res.send(html);
  }

  @Post('resume-projects/:id/export-pdf')
  @UseGuards(JwtAuthGuard)
  async exportPdf(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.resumeService.getById(user.userId, id);
    const pdf = await this.pdfService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resume-${id}.pdf"`,
    );
    res.send(pdf);
  }
}
