import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { pdfToImages } from './pdfToImages';

async function makePdf(sizes: [number, number][]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const [width, height] of sizes) doc.addPage([width, height]);
  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

describe('pdfToImages', () => {
  it('renders one image per page, scaled up', async () => {
    const input = await makePdf([
      [200, 100],
      [100, 300],
    ]);

    const images = await pdfToImages(input, { scale: 2 });
    expect(images).toHaveLength(2);

    const first = await createImageBitmap(images[0]);
    expect(first.width).toBe(400);
    expect(first.height).toBe(200);

    const second = await createImageBitmap(images[1]);
    expect(second.width).toBe(200);
    expect(second.height).toBe(600);
  });

  it('defaults to jpeg output', async () => {
    const input = await makePdf([[100, 100]]);
    const [image] = await pdfToImages(input);
    expect(image.type).toBe('image/jpeg');
  });

  it('supports png output', async () => {
    const input = await makePdf([[100, 100]]);
    const [image] = await pdfToImages(input, { format: 'image/png' });
    expect(image.type).toBe('image/png');
  });

  it('reports progress up to 100', async () => {
    const input = await makePdf([
      [100, 100],
      [100, 100],
      [100, 100],
    ]);
    const seen: number[] = [];
    await pdfToImages(input, {}, (percent) => seen.push(percent));
    expect(seen.at(-1)).toBe(100);
  });
});
