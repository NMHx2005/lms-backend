import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export type PdfSection = {
  title?: string;
  lines?: string[];
};

export const generateSimplePdfBuffer = async (
  title: string,
  sections: PdfSection[] = []
): Promise<Buffer> => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: any) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    for (const section of sections) {
      if (section.title) {
        doc.fontSize(14).text(section.title, { underline: true });
        doc.moveDown(0.5);
      }
      if (section.lines?.length) {
        doc.fontSize(11);
        for (const line of section.lines) doc.text(line);
        doc.moveDown();
      }
    }

    doc.end();
  });
};


