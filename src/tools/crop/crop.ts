export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  mimeType?: string;
}

export type CropProgress = (percent: number) => void;

export async function crop(
  input: Blob,
  opts: CropOptions,
  onProgress?: CropProgress,
): Promise<Blob> {
  const mimeType = opts.mimeType ?? input.type ?? 'image/png';

  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const canvas = new OffscreenCanvas(opts.width, opts.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('crop: could not get 2d context');
  }
  ctx.drawImage(bitmap, opts.x, opts.y, opts.width, opts.height, 0, 0, opts.width, opts.height);
  onProgress?.(70);

  const result = await canvas.convertToBlob({ type: mimeType });
  onProgress?.(100);

  return result;
}
