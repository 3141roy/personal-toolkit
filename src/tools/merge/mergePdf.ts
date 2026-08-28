import { PDFDocument } from 'pdf-lib';

export type MergeProgress = (percent: number) => void;

export async function mergePdfs(inputs: Blob[], onProgress?: MergeProgress): Promise<Blob> {
  if (inputs.length === 0) {
    throw new Error('mergePdfs: no PDFs to merge');
  }

  const output = await PDFDocument.create();

  for (let index = 0; index < inputs.length; index++) {
    const bytes = new Uint8Array(await inputs[index].arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await output.copyPages(doc, doc.getPageIndices());
    for (const page of pages) output.addPage(page);

    onProgress?.(Math.round(((index + 1) / inputs.length) * 100));
  }

  const bytes = await output.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}
