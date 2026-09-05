export interface PdfToImagesOptions {
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
  scale?: number;
}

export type PdfToImagesProgress = (percent: number) => void;

export async function pdfToImages(
  input: Blob,
  opts: PdfToImagesOptions = {},
  onProgress?: PdfToImagesProgress,
): Promise<Blob[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).href;

  const format = opts.format ?? 'image/jpeg';
  const scale = opts.scale ?? 2;

  const buffer = await input.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const images: Blob[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = new OffscreenCanvas(Math.round(viewport.width), Math.round(viewport.height));
    await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;

    images.push(await canvas.convertToBlob({ type: format, quality: opts.quality }));
    onProgress?.(Math.round((pageNumber / doc.numPages) * 100));
  }

  return images;
}
