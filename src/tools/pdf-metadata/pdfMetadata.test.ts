import { describe, it, expect } from 'vitest';
import { PDFDict, PDFDocument, PDFName, PDFString } from 'pdf-lib';
import {
  infoKey,
  isEditable,
  PIECE_INFO_KEY,
  withBlankFields,
  readPdfMetadata,
  stripPdfMetadata,
  XMP_KEY,
} from './pdfMetadata';

const XMP = '<x:xmpmeta><rdf:li>Secret Author</rdf:li></x:xmpmeta>';

async function makeLoadedPdf(): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.addPage([100, 100]);
  doc.addPage([200, 200]);
  doc.setTitle('Quarterly Report');
  doc.setAuthor('Secret Author');
  doc.setProducer('Some Writer 9');
  doc.setCreationDate(new Date(Date.UTC(2024, 0, 15, 10, 30)));
  doc.context
    .lookup(doc.context.trailerInfo.Info, PDFDict)
    .set(PDFName.of('Company'), PDFString.of('Acme'));

  const xmpRef = doc.context.register(
    doc.context.stream(XMP, { Type: 'Metadata', Subtype: 'XML' }),
  );
  doc.catalog.set(PDFName.of('Metadata'), xmpRef);
  doc.catalog.set(PDFName.of('PieceInfo'), doc.context.obj({ App: {} }));
  doc.getPage(0).node.set(PDFName.of('PieceInfo'), doc.context.obj({ App: {} }));

  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

async function reopen(blob: Blob): Promise<PDFDocument> {
  return PDFDocument.load(await blob.arrayBuffer(), { updateMetadata: false });
}

describe('readPdfMetadata', () => {
  it('lists info fields, custom keys, XMP and app data', async () => {
    const entries = await readPdfMetadata(await makeLoadedPdf());
    const byLabel = Object.fromEntries(entries.map((e) => [e.label, e.value]));

    expect(byLabel['Title']).toBe('Quarterly Report');
    expect(byLabel['Author']).toBe('Secret Author');
    expect(byLabel['Producer']).toBe('Some Writer 9');
    expect(byLabel['Created']).toBe('2024-01-15 10:30');
    expect(byLabel['Company']).toBe('Acme');
    expect(byLabel['Embedded XMP']).toBe(`${XMP.length} B`);
    expect(byLabel['App-private data']).toBe('present');
  });

  it('puts known fields before custom ones', async () => {
    const entries = await readPdfMetadata(await makeLoadedPdf());
    const labels = entries.map((e) => e.label);
    expect(labels.indexOf('Title')).toBeLessThan(labels.indexOf('Company'));
  });

  it('reports nothing for a PDF with no metadata', async () => {
    const stripped = await stripPdfMetadata(await makeLoadedPdf());
    expect(await readPdfMetadata(stripped)).toEqual([]);
  });
});

describe('stripPdfMetadata', () => {
  it('removes info dict, XMP and app data but keeps the pages', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf());
    const doc = await reopen(output);
    expect(doc.context.trailerInfo.Info).toBeUndefined();

    expect(doc.getPageCount()).toBe(2);
    expect(doc.getTitle()).toBeUndefined();
    expect(doc.getAuthor()).toBeUndefined();
    expect(doc.getProducer()).toBeUndefined();
    expect(doc.getCreationDate()).toBeUndefined();
    expect(doc.catalog.has(PDFName.of('Metadata'))).toBe(false);
    expect(doc.catalog.has(PDFName.of('PieceInfo'))).toBe(false);
    expect(doc.getPage(0).node.has(PDFName.of('PieceInfo'))).toBe(false);
  });

  it('leaves no trace of the XMP stream in the bytes', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf());
    const text = new TextDecoder('latin1').decode(await output.arrayBuffer());
    expect(text).not.toContain('xmpmeta');
    expect(text).not.toContain('Secret Author');
  });

  it('does not stamp a new producer or date', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf());
    const doc = await reopen(output);
    const info = doc.context.trailerInfo.Info;
    expect(info === undefined || doc.context.lookupMaybe(info, PDFDict) === undefined).toBe(true);
  });

  it('reports progress up to 100', async () => {
    const seen: number[] = [];
    await stripPdfMetadata(await makeLoadedPdf(), {}, (p) => seen.push(p));
    expect(seen.at(-1)).toBe(100);
  });
});

describe('stripPdfMetadata keep', () => {
  it('keeps only the ticked info fields', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf(), {
      keep: [infoKey('Title'), infoKey('Company')],
    });
    const byLabel = Object.fromEntries(
      (await readPdfMetadata(output)).map((e) => [e.label, e.value]),
    );

    expect(byLabel['Title']).toBe('Quarterly Report');
    expect(byLabel['Company']).toBe('Acme');
    expect(byLabel['Author']).toBeUndefined();
    expect(byLabel['Producer']).toBeUndefined();
    expect(byLabel['Created']).toBeUndefined();
    expect(byLabel['Embedded XMP']).toBeUndefined();
    expect(byLabel['App-private data']).toBeUndefined();
  });

  it('keeps the catalog XMP and app data when ticked, still clears page-level ones', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf(), {
      keep: [XMP_KEY, PIECE_INFO_KEY],
    });
    const labels = (await readPdfMetadata(output)).map((e) => e.label);
    const doc = await reopen(output);

    expect(labels).toEqual(['Embedded XMP', 'App-private data']);
    expect(doc.context.trailerInfo.Info).toBeUndefined();
    expect(doc.getPage(0).node.has(PDFName.of('PieceInfo'))).toBe(false);
  });

  it('keeping everything removes nothing', async () => {
    const input = await makeLoadedPdf();
    const entries = await readPdfMetadata(input);
    const output = await stripPdfMetadata(input, { keep: entries.map((e) => e.key) });

    expect(await readPdfMetadata(output)).toEqual(entries);
  });

  it('ignores keys that do not exist', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf(), { keep: ['info:Nope'] });
    expect(await readPdfMetadata(output)).toEqual([]);
  });
});

describe('stripPdfMetadata edits', () => {
  it('rewrites an existing field and sets a missing one', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf(), {
      keep: [infoKey('Author')],
      edits: { [infoKey('Title')]: 'Clean Title', [infoKey('Subject')]: 'Fresh subject' },
    });
    const byLabel = Object.fromEntries(
      (await readPdfMetadata(output)).map((e) => [e.label, e.value]),
    );

    expect(byLabel['Title']).toBe('Clean Title');
    expect(byLabel['Subject']).toBe('Fresh subject');
    expect(byLabel['Author']).toBe('Secret Author');
    expect(byLabel['Producer']).toBeUndefined();
    expect(byLabel['Company']).toBeUndefined();
  });

  it('keeps unicode text intact', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf(), {
      edits: { [infoKey('Title')]: 'Résumé \u2014 \u65e5\u672c\u8a9e' },
    });
    const entries = await readPdfMetadata(output);
    expect(entries.find((e) => e.label === 'Title')?.value).toBe(
      'Résumé \u2014 \u65e5\u672c\u8a9e',
    );
  });

  it('creates an info dict on a PDF that has none', async () => {
    const bare = await stripPdfMetadata(await makeLoadedPdf());
    const output = await stripPdfMetadata(bare, { edits: { [infoKey('Title')]: 'Brand new' } });

    expect(await readPdfMetadata(output)).toEqual([
      { key: infoKey('Title'), label: 'Title', value: 'Brand new' },
    ]);
  });

  it('removes a field when its edit is blank', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf(), {
      keep: [infoKey('Title'), infoKey('Author')],
      edits: { [infoKey('Title')]: '   ' },
    });
    const labels = (await readPdfMetadata(output)).map((e) => e.label);
    expect(labels).toEqual(['Author']);
  });

  it('ignores edits to dates and non-info keys', async () => {
    const output = await stripPdfMetadata(await makeLoadedPdf(), {
      edits: { [infoKey('CreationDate')]: 'D:20000101', [XMP_KEY]: 'x' },
    });
    expect(await readPdfMetadata(output)).toEqual([]);
  });
});

describe('field helpers', () => {
  it('marks only info text fields editable', () => {
    expect(isEditable(infoKey('Title'))).toBe(true);
    expect(isEditable(infoKey('Company'))).toBe(true);
    expect(isEditable(infoKey('CreationDate'))).toBe(false);
    expect(isEditable(XMP_KEY)).toBe(false);
  });

  it('adds blank rows for missing standard fields in order', async () => {
    const bare = await stripPdfMetadata(await makeLoadedPdf());
    const rows = withBlankFields(await readPdfMetadata(bare));
    expect(rows.map((r) => r.label)).toEqual(['Title', 'Author', 'Subject', 'Keywords']);
    expect(rows.every((r) => r.value === '')).toBe(true);
  });
});
