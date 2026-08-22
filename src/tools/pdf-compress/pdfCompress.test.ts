import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { compressPdf } from './pdfCompress';

async function photoJpeg(width: number, height: number): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('photoJpeg: could not get 2d context');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#8a3324');
  gradient.addColorStop(1, '#283b49');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `hsl(${i % 360} 70% 50%)`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 10, 10);
  }
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 1 });
  return new Uint8Array(await blob.arrayBuffer());
}

async function makePdf(options: { text: boolean; image: boolean }): Promise<Blob> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);

  if (options.image) {
    const image = await doc.embedJpg(await photoJpeg(1800, 1400));
    page.drawImage(image, { x: 0, y: 300, width: 595, height: 450 });
  }
  if (options.text) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText('the quick brown fox', { x: 60, y: 120, size: 24, font });
  }

  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

function fontNamesOf(doc: PDFDocument): string {
  const fonts = doc.getPage(0).node.normalizedEntries().Font;
  return fonts ? fonts.toString() : '';
}

describe('compressPdf', () => {
  it('shrinks a PDF whose weight is embedded images', async () => {
    const input = await makePdf({ text: true, image: true });
    const output = await compressPdf(input, { quality: 0.5 });

    expect(output.size).toBeLessThan(input.size);
  });

  it('keeps text as vector, not pixels', async () => {
    const input = await makePdf({ text: true, image: true });
    const output = await compressPdf(input, { quality: 0.5 });
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(1);
    expect(fontNamesOf(doc)).toContain('Helvetica');
  });

  it('returns the original when there is nothing to shave', async () => {
    const input = await makePdf({ text: true, image: false });
    const output = await compressPdf(input, { quality: 0.5 });

    expect(output.size).toBeLessThanOrEqual(input.size);
  });

  it('lower quality yields a smaller file', async () => {
    const input = await makePdf({ text: false, image: true });
    const low = await compressPdf(input, { quality: 0.2 });
    const high = await compressPdf(input, { quality: 0.9 });

    expect(low.size).toBeLessThan(high.size);
  });

  it('reports progress up to 100', async () => {
    const seen: number[] = [];
    await compressPdf(await makePdf({ text: true, image: true }), { quality: 0.5 }, (percent) =>
      seen.push(percent),
    );

    expect(seen.at(-1)).toBe(100);
  });
});
