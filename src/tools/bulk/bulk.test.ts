import { describe, it, expect } from 'vitest';
import { processOne } from './bulk';

async function makeTestImage(width: number, height: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeTestImage: could not get 2d context');
  }
  ctx.fillStyle = '#8a3324';
  ctx.fillRect(0, 0, width, height);
  return canvas.convertToBlob({ type: 'image/png' });
}

describe('processOne', () => {
  it('dispatches to resize', async () => {
    const input = await makeTestImage(200, 200);
    const output = await processOne(input, { type: 'resize', opts: { width: 50, height: 40 } });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(50);
    expect(bitmap.height).toBe(40);
  });

  it('dispatches to compress', async () => {
    const input = await makeTestImage(200, 200);
    const output = await processOne(input, {
      type: 'compress',
      opts: { mimeType: 'image/jpeg', quality: 0.5 },
    });
    expect(output.type).toBe('image/jpeg');
  });

  it('dispatches to convert', async () => {
    const input = await makeTestImage(200, 200);
    const output = await processOne(input, { type: 'convert', opts: { mimeType: 'image/webp' } });
    expect(output.type).toBe('image/webp');
  });

  it('forwards progress callbacks through the dispatch', async () => {
    const input = await makeTestImage(100, 100);
    const seen: number[] = [];
    await processOne(input, { type: 'resize', opts: { width: 50, height: 50 } }, (percent) => {
      seen.push(percent);
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1]).toBe(100);
  });
});
