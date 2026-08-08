import { describe, it, expect } from 'vitest';
import { rotate } from './rotate';

async function makeSplitImage(width: number, height: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeSplitImage: could not get 2d context');
  }
  ctx.fillStyle = '#8a3324';
  ctx.fillRect(0, 0, width / 2, height);
  ctx.fillStyle = '#283b49';
  ctx.fillRect(width / 2, 0, width / 2, height);
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

describe('rotate', () => {
  it('swaps dimensions on a 90 degree rotation', async () => {
    const input = await makeSplitImage(100, 60);
    const output = await rotate(input, { rotate: 90 });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(60);
    expect(bitmap.height).toBe(100);
  });

  it('keeps dimensions on a 180 degree rotation', async () => {
    const input = await makeSplitImage(100, 60);
    const output = await rotate(input, { rotate: 180 });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(100);
    expect(bitmap.height).toBe(60);
  });

  it('flips horizontally, swapping left and right content', async () => {
    const input = await makeSplitImage(100, 60);
    const output = await rotate(input, { flipHorizontal: true });

    // after a horizontal flip, the left side should show what was originally
    // on the right (navy: low red, high blue), and vice versa
    const [rLeft, , bLeft] = await samplePixel(output, 10, 30);
    const [rRight, , bRight] = await samplePixel(output, 90, 30);

    expect(rLeft).toBeLessThan(80);
    expect(bLeft).toBeGreaterThan(60);
    expect(rRight).toBeGreaterThan(100);
    expect(bRight).toBeLessThan(80);
  });
});
