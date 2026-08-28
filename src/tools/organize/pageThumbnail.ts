export async function renderThumbnails(input: Blob, maxWidth = 96): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).href;

  const buffer = await input.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const thumbnails: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const unscaled = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: maxWidth / unscaled.width });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));

    await page.render({ canvas, viewport }).promise;
    thumbnails.push(canvas.toDataURL('image/png'));
  }

  return thumbnails;
}
