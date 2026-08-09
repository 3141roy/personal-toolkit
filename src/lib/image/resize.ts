import pica from 'pica';

export type ResizeEngine = 'native' | 'pica';

export interface ResizeOptions {
  width: number;
  height: number;
  mimeType?: string;
  quality?: number;
  engine?: ResizeEngine;
}

export type ResizeProgress = (percent: number) => void;

const DEFAULT_ENGINE: ResizeEngine = 'native';

const picaInstance = pica();

export async function resize(
  input: Blob,
  opts: ResizeOptions,
  onProgress?: ResizeProgress,
): Promise<Blob> {
  const engine = opts.engine ?? DEFAULT_ENGINE;
  return engine === 'pica'
    ? resizeWithPica(input, opts, onProgress)
    : resizeNative(input, opts, onProgress);
}

async function resizeNative(
  input: Blob,
  opts: ResizeOptions,
  onProgress?: ResizeProgress,
): Promise<Blob> {
  const mimeType = opts.mimeType ?? input.type ?? 'image/png';

  onProgress?.(20);
  const bitmap = await createImageBitmap(input, {
    resizeWidth: opts.width,
    resizeHeight: opts.height,
    resizeQuality: 'high',
  });

  onProgress?.(60);
  const canvas = new OffscreenCanvas(opts.width, opts.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('resize: could not get 2d context on canvas');
  }
  ctx.drawImage(bitmap, 0, 0);

  const result = await canvas.convertToBlob({ type: mimeType, quality: opts.quality });
  onProgress?.(100);

  return result;
}

async function resizeWithPica(
  input: Blob,
  opts: ResizeOptions,
  onProgress?: ResizeProgress,
): Promise<Blob> {
  const mimeType = opts.mimeType ?? input.type ?? 'image/png';

  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const sourceCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
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
