import { describe, it, expect } from 'vitest';
import { compress } from './compress';

async function makeTestImage(width: number, height: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeTestImage: could not get 2d context');
  }
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#8a3324');
  gradient.addColorStop(1, '#283b49');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  return canvas.convertToBlob({ type: 'image/png' });
}

describe('compress', () => {
  it('produces a blob with the requested mime type', async () => {
    const input = await makeTestImage(300, 200);
    const output = await compress(input, { mimeType: 'image/jpeg', quality: 0.8 });
    expect(output.type).toBe('image/jpeg');
  });

  it('lower quality produces a smaller-or-equal file than higher quality', async () => {
    const input = await makeTestImage(300, 200);
    const high = await compress(input, { mimeType: 'image/jpeg', quality: 0.95 });
    const low = await compress(input, { mimeType: 'image/jpeg', quality: 0.2 });
    expect(low.size).toBeLessThanOrEqual(high.size);
  });

  it('defaults to the input mime type when none is given', async () => {
    const input = await makeTestImage(150, 150);
    const output = await compress(input, { quality: 0.7 });
    expect(output.type).toBe('image/png');
  });
});
