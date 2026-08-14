export interface RoundCropOptions {
  shape: 'circle' | 'square';
  x: number;
  y: number;
  size: number;
}

export type RoundCropProgress = (percent: number) => void;

export async function roundCrop(
  input: Blob,
  opts: RoundCropOptions,
  onProgress?: RoundCropProgress,
): Promise<Blob> {
  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const canvas = new OffscreenCanvas(opts.size, opts.size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('roundCrop: could not get 2d context');
  }

  if (opts.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(opts.size / 2, opts.size / 2, opts.size / 2, 0, Math.PI * 2);
    ctx.clip();
  }
  onProgress?.(40);

  ctx.drawImage(bitmap, opts.x, opts.y, opts.size, opts.size, 0, 0, opts.size, opts.size);
  onProgress?.(80);

  const result = await canvas.convertToBlob({ type: 'image/png' });
  onProgress?.(100);

  return result;
}
