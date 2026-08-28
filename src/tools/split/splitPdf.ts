import { PDFDocument } from 'pdf-lib';

export interface SplitRange {
  start: number;
  end: number;
}

export type SplitProgress = (percent: number) => void;

export function parseRanges(input: string, pageCount: number): SplitRange[] {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('no ranges given');

  return trimmed.split(',').map((token) => {
    const part = token.trim();
    if (!part) throw new Error('empty range');

    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`"${part}" isn't a page or range`);

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;

    if (start < 1 || end > pageCount || start > end) {
      throw new Error(`"${part}" is out of range for a ${pageCount}-page PDF`);
    }

    return { start, end };
  });
}

export function everyPageRange(pageCount: number): SplitRange[] {
  return Array.from({ length: pageCount }, (_, i) => ({ start: i + 1, end: i + 1 }));
}

export async function splitPdf(
  input: Blob,
  ranges: SplitRange[],
  onProgress?: SplitProgress,
): Promise<Blob[]> {
  if (ranges.length === 0) {
    throw new Error('splitPdf: no ranges to extract');
  }

  const bytes = new Uint8Array(await input.arrayBuffer());
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = source.getPageCount();

  const outputs: Blob[] = [];

  for (let index = 0; index < ranges.length; index++) {
    const { start, end } = ranges[index];
    if (start < 1 || end > pageCount || start > end) {
      throw new Error(`splitPdf: invalid range ${start}-${end} for a ${pageCount}-page PDF`);
    }

    const doc = await PDFDocument.create();
    const indices = [];
    for (let page = start; page <= end; page++) indices.push(page - 1);

    const pages = await doc.copyPages(source, indices);
    for (const page of pages) doc.addPage(page);

    const out = await doc.save();
    outputs.push(new Blob([out.slice().buffer], { type: 'application/pdf' }));

    onProgress?.(Math.round(((index + 1) / ranges.length) * 100));
  }

  return outputs;
}
