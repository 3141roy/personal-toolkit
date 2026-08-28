import { PDFDocument } from 'pdf-lib';

export interface PageRef {
  fileIndex: number;
  pageIndex: number;
}

export type OrganizeProgress = (percent: number) => void;

export async function organizePdf(
  inputs: Blob[],
  pages: PageRef[],
  onProgress?: OrganizeProgress,
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error('organizePdf: no pages to keep');
  }

  const sources = await Promise.all(
    inputs.map(async (input) => {
      const bytes = new Uint8Array(await input.arrayBuffer());
      return PDFDocument.load(bytes, { ignoreEncryption: true });
    }),
  );

  const output = await PDFDocument.create();

  for (let index = 0; index < pages.length; index++) {
    const { fileIndex, pageIndex } = pages[index];
    const source = sources[fileIndex];
    if (!source || pageIndex < 0 || pageIndex >= source.getPageCount()) {
      throw new Error(`organizePdf: invalid page reference ${fileIndex}:${pageIndex}`);
    }

    const [page] = await output.copyPages(source, [pageIndex]);
    output.addPage(page);

    onProgress?.(Math.round(((index + 1) / pages.length) * 100));
  }

  const bytes = await output.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}
