import { describe, it, expect } from 'vitest';
import { crop } from './crop';

async function makeQuadrantImage(): Promise<Blob> {
  const canvas = new OffscreenCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeQuadrantImage: could not get 2d context');
  }
  ctx.fillStyle = '#8a3324';
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = '#283b49';
  ctx.fillRect(100, 100, 100, 100);
  return canvas.convertToBlob({ type: 'image/png' });
}

async function samplePixel(blob: Blob, x: number, y: number) {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('samplePixel: could not get 2d context');
  ctx.drawImage(bitmap, 0, 0);
  return Array.from(ctx.getImageData(x, y, 1, 1).data);
}

describe('crop', () => {
  it('produces output at the requested dimensions', async () => {
    const input = await makeQuadrantImage();
    const output = await crop(input, { x: 0, y: 0, width: 80, height: 60 });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(80);
    expect(bitmap.height).toBe(60);
  });

  it('extracts the correct region, not just a resize', async () => {
    const input = await makeQuadrantImage();
    const topLeftCrop = await crop(input, { x: 0, y: 0, width: 50, height: 50 });
    const [r, g] = await samplePixel(topLeftCrop, 25, 25);
    expect(r).toBeGreaterThan(100);
    expect(g).toBeLessThan(100);

    const bottomRightCrop = await crop(input, { x: 100, y: 100, width: 50, height: 50 });
    const [r2, , b2] = await samplePixel(bottomRightCrop, 25, 25);
    expect(b2).toBeGreaterThan(60);
    expect(r2).toBeLessThan(80);
  });
});
