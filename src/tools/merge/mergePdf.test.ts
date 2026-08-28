import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from './mergePdf';

async function makePdf(sizes: [number, number][]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const [width, height] of sizes) doc.addPage([width, height]);
  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

describe('mergePdfs', () => {
  it('combines pages from every input, in order', async () => {
    const a = await makePdf([[100, 200]]);
    const b = await makePdf([
      [300, 400],
      [500, 600],
    ]);

    const output = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getSize()).toEqual({ width: 100, height: 200 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 300, height: 400 });
    expect(doc.getPage(2).getSize()).toEqual({ width: 500, height: 600 });
  });

  it('respects input order, not insertion by size', async () => {
    const a = await makePdf([[500, 600]]);
    const b = await makePdf([[100, 200]]);

    const output = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPage(0).getSize()).toEqual({ width: 500, height: 600 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 100, height: 200 });
  });

  it('works with a single input', async () => {
    const a = await makePdf([
      [100, 200],
      [100, 200],
    ]);

    const output = await mergePdfs([a]);
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(2);
  });

  it('rejects an empty list of inputs', async () => {
    await expect(mergePdfs([])).rejects.toThrow();
  });

  it('reports progress up to 100', async () => {
    const seen: number[] = [];
    await mergePdfs([await makePdf([[100, 200]]), await makePdf([[100, 200]])], (percent) =>
      seen.push(percent),
    );

    expect(seen.at(-1)).toBe(100);
  });
});
