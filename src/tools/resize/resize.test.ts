import { describe, it, expect } from 'vitest';
import { resize } from './resize';

async function makeTestImage(width: number, height: number, mimeType = 'image/png'): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeTestImage: could not get 2d context');
  }
  ctx.fillStyle = '#8a3324';
  ctx.fillRect(0, 0, width, height);
  return canvas.convertToBlob({ type: mimeType });
}

describe('resize', () => {
  it('produces a blob with the requested mime type', async () => {
    const input = await makeTestImage(400, 300);
    const output = await resize(input, { width: 200, height: 150, mimeType: 'image/png' });
    expect(output.type).toBe('image/png');
  });

  it('produces an image with the requested dimensions', async () => {
    const input = await makeTestImage(400, 300);
    const output = await resize(input, { width: 100, height: 80 });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(100);
    expect(bitmap.height).toBe(80);
  });

  it('defaults to the input mime type when none is given', async () => {
    const input = await makeTestImage(200, 200, 'image/jpeg');
    const output = await resize(input, { width: 50, height: 50 });
    expect(output.type).toBe('image/jpeg');
  });
});
