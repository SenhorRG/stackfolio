import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import { CvPreviewRenderer } from './cv-preview.renderer';

@Injectable()
export class PdfService implements OnModuleDestroy {
  private browser: Browser | null = null;

  constructor(private readonly previewRenderer: CvPreviewRenderer) {}

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async generatePdf(projectId: string): Promise<Buffer> {
    const html = await this.previewRenderer.renderForPdf(projectId);
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'load' });
      await page.emulateMedia({ media: 'print' });
      const pdf = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy() {
    await this.browser?.close();
  }
}
