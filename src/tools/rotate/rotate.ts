export interface RotateOptions {
  rotate?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  mimeType?: string;
}

export type RotateProgress = (percent: number) => void;

export async function rotate(
  input: Blob,
  opts: RotateOptions = {},
  onProgress?: RotateProgress,
): Promise<Blob> {
  const rotateDeg = opts.rotate ?? 0;
  const mimeType = opts.mimeType ?? input.type ?? 'image/png';

  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const swapDims = rotateDeg === 90 || rotateDeg === 270;
  const outWidth = swapDims ? bitmap.height : bitmap.width;
  const outHeight = swapDims ? bitmap.width : bitmap.height;

  const canvas = new OffscreenCanvas(outWidth, outHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('rotate: could not get 2d context');
  }

  ctx.translate(outWidth / 2, outHeight / 2);
  ctx.rotate((rotateDeg * Math.PI) / 180);
  ctx.scale(opts.flipHorizontal ? -1 : 1, opts.flipVertical ? -1 : 1);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  onProgress?.(70);

  const result = await canvas.convertToBlob({ type: mimeType });
  onProgress?.(100);

  return result;
}
