import pica from 'pica';

export interface ResizeOptions {
  width: number;
  height: number;
  mimeType?: string;
  quality?: number;
}

export type ResizeProgress = (percent: number) => void;

const picaInstance = pica();

export async function resize(
  input: Blob,
  opts: ResizeOptions,
  onProgress?: ResizeProgress,
): Promise<Blob> {
  const mimeType = opts.mimeType ?? input.type ?? 'image/png';

  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const sourceCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('resize: could not get 2d context on source canvas');
  }
  sourceCtx.drawImage(bitmap, 0, 0);

  onProgress?.(30);
  const destCanvas = new OffscreenCanvas(opts.width, opts.height);

  await picaInstance.resize(sourceCanvas, destCanvas);
  onProgress?.(80);

  const result = await picaInstance.toBlob(destCanvas, mimeType, opts.quality);
  onProgress?.(100);

  return result;
}
