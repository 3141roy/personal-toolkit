import { describe, it, expect } from 'vitest';
import { convert } from './convert';

async function makeTestImage(width: number, height: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeTestImage: could not get 2d context');
  }
  ctx.fillStyle = '#283b49';
  ctx.fillRect(0, 0, width, height);
  return canvas.convertToBlob({ type: 'image/png' });
}

describe('convert', () => {
  it('converts png input to jpeg output', async () => {
    const input = await makeTestImage(200, 150);
    const output = await convert(input, { mimeType: 'image/jpeg' });
    expect(output.type).toBe('image/jpeg');
  });

  it('converts to webp output', async () => {
    const input = await makeTestImage(200, 150);
    const output = await convert(input, { mimeType: 'image/webp' });
    expect(output.type).toBe('image/webp');
  });

  it('preserves image dimensions across formats', async () => {
    const input = await makeTestImage(240, 180);
    const output = await convert(input, { mimeType: 'image/jpeg' });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(240);
    expect(bitmap.height).toBe(180);
  });
});
