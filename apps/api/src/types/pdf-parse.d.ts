declare module 'pdf-parse' {
  type PdfParseResult = { text: string; numpages: number; info: unknown };

  function pdfParse(data: Buffer): Promise<PdfParseResult>;

  export default pdfParse;
}
