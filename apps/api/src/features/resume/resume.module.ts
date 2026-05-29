import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CvPreviewRenderer } from './cv-preview.renderer';
import { PdfService } from './pdf.service';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [ResumeService, CvPreviewRenderer, PdfService],
  exports: [CvPreviewRenderer, ResumeService],
})
export class ResumeModule {}
