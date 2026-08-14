import { describe, it, expect } from 'vitest';
import { roundCrop } from './roundCrop';

async function makeSolidImage(width: number, height: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeSolidImage: could not get 2d context');
  }
  ctx.fillStyle = '#8a3324';
  ctx.fillRect(0, 0, width, height);
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

describe('roundCrop', () => {
  it('produces output at the requested size', async () => {
    const input = await makeSolidImage(200, 200);
    const output = await roundCrop(input, { shape: 'square', x: 0, y: 0, size: 80 });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(80);
    expect(bitmap.height).toBe(80);
  });

  it('clips corners to transparent for circle', async () => {
    const input = await makeSolidImage(200, 200);
    const output = await roundCrop(input, { shape: 'circle', x: 0, y: 0, size: 100 });
    const [, , , cornerAlpha] = await samplePixel(output, 2, 2);
    const [, , , centerAlpha] = await samplePixel(output, 50, 50);
    expect(cornerAlpha).toBe(0);
    expect(centerAlpha).toBe(255);
  });

  it('keeps corners opaque for square', async () => {
    const input = await makeSolidImage(200, 200);
    const output = await roundCrop(input, { shape: 'square', x: 0, y: 0, size: 100 });
    const [, , , cornerAlpha] = await samplePixel(output, 2, 2);
    expect(cornerAlpha).toBe(255);
  });
});
