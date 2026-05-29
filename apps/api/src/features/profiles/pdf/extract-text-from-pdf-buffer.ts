import pdfParse from 'pdf-parse';

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text ?? '';
}
