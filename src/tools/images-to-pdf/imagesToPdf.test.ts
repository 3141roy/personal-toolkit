import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { imagesToPdf } from './imagesToPdf';

async function makeImage(width: number, height: number, type: string): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeImage: could not get 2d context');
  }
  ctx.fillStyle = '#8a3324';
  ctx.fillRect(0, 0, width, height);
  return canvas.convertToBlob({ type });
}

describe('imagesToPdf', () => {
  it('puts each image on its own page, at its own size', async () => {
    const a = await makeImage(100, 200, 'image/png');
    const b = await makeImage(300, 150, 'image/jpeg');

    const output = await imagesToPdf([a, b]);
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize()).toEqual({ width: 100, height: 200 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 300, height: 150 });
  });

  it('respects input order', async () => {
    const a = await makeImage(500, 600, 'image/png');
    const b = await makeImage(100, 200, 'image/png');

    const output = await imagesToPdf([a, b]);
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPage(0).getSize()).toEqual({ width: 500, height: 600 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 100, height: 200 });
  });

  it('works with a single image', async () => {
    const a = await makeImage(200, 200, 'image/png');
    const output = await imagesToPdf([a]);
    const doc = await PDFDocument.load(await output.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
  });

  it('rejects an empty list of inputs', async () => {
    await expect(imagesToPdf([])).rejects.toThrow();
  });

  it('reports progress up to 100', async () => {
    const seen: number[] = [];
    await imagesToPdf(
      [await makeImage(100, 100, 'image/png'), await makeImage(100, 100, 'image/png')],
      (percent) => seen.push(percent),
    );

    expect(seen.at(-1)).toBe(100);
  });
});
