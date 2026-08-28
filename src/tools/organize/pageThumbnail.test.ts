import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb } from 'pdf-lib';
import { renderThumbnails } from './pageThumbnail';

async function makeColoredPdf(colors: [number, number, number][]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const [r, g, b] of colors) {
    const page = doc.addPage([100, 100]);
    page.drawRectangle({ x: 0, y: 0, width: 100, height: 100, color: rgb(r, g, b) });
  }
  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

async function centerPixel(dataUrl: string): Promise<[number, number, number, number]> {
  const image = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('centerPixel: could not get 2d context');
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(
    Math.floor(image.width / 2),
    Math.floor(image.height / 2),
    1,
    1,
  );
  return [data[0], data[1], data[2], data[3]];
}

describe('renderThumbnails', () => {
  it('renders one thumbnail per page, in order', async () => {
    const input = await makeColoredPdf([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);

    const thumbnails = await renderThumbnails(input, 64);

    expect(thumbnails).toHaveLength(3);
    for (const thumbnail of thumbnails) {
      expect(thumbnail.startsWith('data:image/png')).toBe(true);
    }

    const [red, green, blue] = await Promise.all(thumbnails.map(centerPixel));
    expect(red[0]).toBeGreaterThan(200);
    expect(green[1]).toBeGreaterThan(200);
    expect(blue[2]).toBeGreaterThan(200);
  });

  it('scales down to the requested width', async () => {
    const input = await makeColoredPdf([[1, 1, 1]]);
    const [thumbnail] = await renderThumbnails(input, 40);
    const image = await createImageBitmap(await (await fetch(thumbnail)).blob());

    expect(image.width).toBeLessThanOrEqual(40);
  });
});
