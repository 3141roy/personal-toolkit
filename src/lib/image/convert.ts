export interface ConvertOptions {
  mimeType: string;
  quality?: number;
}

export type ConvertProgress = (percent: number) => void;

export async function convert(
  input: Blob,
  opts: ConvertOptions,
  onProgress?: ConvertProgress,
): Promise<Blob> {
  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('convert: could not get 2d context');
  }
  ctx.drawImage(bitmap, 0, 0);
  onProgress?.(50);

  const result = await canvas.convertToBlob({ type: opts.mimeType, quality: opts.quality ?? 0.92 });
  onProgress?.(100);

  return result;
}
