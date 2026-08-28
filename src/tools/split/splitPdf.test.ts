import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { parseRanges, everyPageRange, splitPdf } from './splitPdf';

async function makePdf(sizes: [number, number][]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const [width, height] of sizes) doc.addPage([width, height]);
  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

describe('parseRanges', () => {
  it('parses single pages and ranges', () => {
    expect(parseRanges('1-3, 5, 8-9', 10)).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 9 },
    ]);
  });

  it('rejects an out-of-bounds page', () => {
    expect(() => parseRanges('1-11', 10)).toThrow();
  });

  it('rejects a backwards range', () => {
    expect(() => parseRanges('5-2', 10)).toThrow();
  });

  it('rejects garbage input', () => {
    expect(() => parseRanges('abc', 10)).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => parseRanges('', 10)).toThrow();
  });
});

describe('everyPageRange', () => {
  it('builds one range per page', () => {
    expect(everyPageRange(3)).toEqual([
      { start: 1, end: 1 },
      { start: 2, end: 2 },
      { start: 3, end: 3 },
    ]);
  });
});

describe('splitPdf', () => {
  it('extracts each requested range into its own PDF', async () => {
    const input = await makePdf([
      [100, 100],
      [200, 200],
      [300, 300],
      [400, 400],
    ]);

    const [first, second] = await splitPdf(input, [
      { start: 1, end: 2 },
      { start: 3, end: 4 },
    ]);

    const firstDoc = await PDFDocument.load(await first.arrayBuffer());
    const secondDoc = await PDFDocument.load(await second.arrayBuffer());

    expect(firstDoc.getPageCount()).toBe(2);
    expect(firstDoc.getPage(0).getSize()).toEqual({ width: 100, height: 100 });
    expect(firstDoc.getPage(1).getSize()).toEqual({ width: 200, height: 200 });

    expect(secondDoc.getPageCount()).toBe(2);
    expect(secondDoc.getPage(0).getSize()).toEqual({ width: 300, height: 300 });
  });

  it('splits into one file per page with everyPageRange', async () => {
    const input = await makePdf([
      [100, 100],
      [200, 200],
      [300, 300],
    ]);

    const outputs = await splitPdf(input, everyPageRange(3));

    expect(outputs).toHaveLength(3);
    for (const output of outputs) {
      const doc = await PDFDocument.load(await output.arrayBuffer());
      expect(doc.getPageCount()).toBe(1);
    }
  });

  it('rejects an out-of-bounds range', async () => {
    const input = await makePdf([[100, 100]]);
    await expect(splitPdf(input, [{ start: 1, end: 5 }])).rejects.toThrow();
  });

  it('rejects an empty list of ranges', async () => {
    const input = await makePdf([[100, 100]]);
    await expect(splitPdf(input, [])).rejects.toThrow();
  });

  it('reports progress up to 100', async () => {
    const input = await makePdf([
      [100, 100],
      [200, 200],
    ]);
    const seen: number[] = [];

    await splitPdf(input, everyPageRange(2), (percent) => seen.push(percent));

    expect(seen.at(-1)).toBe(100);
  });
});
