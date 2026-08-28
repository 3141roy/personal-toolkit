import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { organizePdf } from './organizePdf';

async function makePdf(sizes: [number, number][]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const [width, height] of sizes) doc.addPage([width, height]);
  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

describe('organizePdf', () => {
  it('reorders pages within a single input', async () => {
    const input = await makePdf([
      [100, 100],
      [200, 200],
      [300, 300],
    ]);

    const output = await organizePdf(
      [input],
      [
        { fileIndex: 0, pageIndex: 2 },
        { fileIndex: 0, pageIndex: 0 },
        { fileIndex: 0, pageIndex: 1 },
      ],
    );
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getSize()).toEqual({ width: 300, height: 300 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 100, height: 100 });
    expect(doc.getPage(2).getSize()).toEqual({ width: 200, height: 200 });
  });

  it('deletes pages by omitting them', async () => {
    const input = await makePdf([
      [100, 100],
      [200, 200],
      [300, 300],
    ]);

    const output = await organizePdf(
      [input],
      [
        { fileIndex: 0, pageIndex: 0 },
        { fileIndex: 0, pageIndex: 2 },
      ],
    );
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize()).toEqual({ width: 100, height: 100 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 300, height: 300 });
  });

  it('interleaves pages pulled in from a second input', async () => {
    const a = await makePdf([[100, 100]]);
    const b = await makePdf([[200, 200]]);

    const output = await organizePdf(
      [a, b],
      [
        { fileIndex: 1, pageIndex: 0 },
        { fileIndex: 0, pageIndex: 0 },
      ],
    );
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize()).toEqual({ width: 200, height: 200 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 100, height: 100 });
  });

  it('rejects an invalid page reference', async () => {
    const input = await makePdf([[100, 100]]);
    await expect(organizePdf([input], [{ fileIndex: 0, pageIndex: 5 }])).rejects.toThrow();
  });

  it('rejects an empty page list', async () => {
    const input = await makePdf([[100, 100]]);
    await expect(organizePdf([input], [])).rejects.toThrow();
  });

  it('reports progress up to 100', async () => {
    const input = await makePdf([
      [100, 100],
      [200, 200],
    ]);
    const seen: number[] = [];

    await organizePdf(
      [input],
      [
        { fileIndex: 0, pageIndex: 0 },
        { fileIndex: 0, pageIndex: 1 },
      ],
      (percent) => seen.push(percent),
    );

    expect(seen.at(-1)).toBe(100);
  });
});
