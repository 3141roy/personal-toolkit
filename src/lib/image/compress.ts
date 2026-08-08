export interface CompressOptions {
  quality?: number;
  mimeType?: string;
}

export type CompressProgress = (percent: number) => void;

export async function compress(
  input: Blob,
  opts: CompressOptions = {},
  onProgress?: CompressProgress,
): Promise<Blob> {
  const mimeType = opts.mimeType ?? input.type ?? 'image/jpeg';
  const quality = opts.quality ?? 0.75;

  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('compress: could not get 2d context');
  }
  ctx.drawImage(bitmap, 0, 0);
  onProgress?.(50);

  const result = await canvas.convertToBlob({ type: mimeType, quality });
  onProgress?.(100);

  return result;
}
