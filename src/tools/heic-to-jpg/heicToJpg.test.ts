import { describe, it, expect } from 'vitest';
import { heicToJpg } from './heicToJpg';
import fixtureUrl from './fixture.heic?url';

async function loadFixture(): Promise<Blob> {
  const response = await fetch(fixtureUrl);
  return response.blob();
}

describe('heicToJpg', () => {
  it('decodes a real HEIC file into a JPEG blob', async () => {
    const input = await loadFixture();
    const output = await heicToJpg(input);
    expect(output.type).toBe('image/jpeg');
  });

  it('produces an image with sane dimensions matching the source', async () => {
    const input = await loadFixture();
    const output = await heicToJpg(input);
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(300);
    expect(bitmap.height).toBe(200);
  });

  it('reports progress reaching 100', async () => {
    const input = await loadFixture();
    const seen: number[] = [];
    await heicToJpg(input, {}, (percent) => seen.push(percent));
    expect(seen[seen.length - 1]).toBe(100);
  });
});
