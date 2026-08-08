import heic2any from 'heic2any';

export interface HeicToJpgOptions {
  quality?: number;
}

export type HeicToJpgProgress = (percent: number) => void;

export async function heicToJpg(
  input: Blob,
  opts: HeicToJpgOptions = {},
  onProgress?: HeicToJpgProgress,
): Promise<Blob> {
  onProgress?.(10);

  const result = await heic2any({
    blob: input,
    toType: 'image/jpeg',
    quality: opts.quality ?? 0.92,
  });

  onProgress?.(100);

  return Array.isArray(result) ? result[0] : result;
}
