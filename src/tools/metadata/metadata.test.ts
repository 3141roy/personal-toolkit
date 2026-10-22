import { describe, it, expect } from 'vitest';
import { readMetadata, clearMetadata } from './metadata';
import { readJpegRows, rewriteJpeg, rewriteMetadata } from './jpegMetadata';

async function makeBaseJpeg(width: number, height: number): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('makeBaseJpeg: could not get 2d context');
  }
  ctx.fillStyle = '#8a3324';
  ctx.fillRect(0, 0, width, height);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg' });
  return blob.arrayBuffer();
}

function asciiBytes(value: string): number[] {
  return [...value].map((ch) => ch.charCodeAt(0)).concat(0);
}

const TIFF_ASCII = 2;
const TIFF_SHORT = 3;
const TIFF_LONG = 4;
const EXIF_IFD_POINTER = 0x8769;

function buildExifApp1(): number[] {
  const make = asciiBytes('Bundle');
  const model = asciiBytes('Toolkit');

  const ifd0EntryCount = 3;
  const ifd0Start = 8;
  const ifd0EntriesStart = ifd0Start + 2;
  const ifd0EntriesEnd = ifd0EntriesStart + ifd0EntryCount * 12;
  const ifd0NextOffset = ifd0EntriesEnd;
  const dataStart = ifd0NextOffset + 4;

  const makeOffset = dataStart;
  const modelOffset = makeOffset + make.length;
  const exifIfdStart = modelOffset + model.length;

  const exifEntryCount = 2;
  const exifEntriesStart = exifIfdStart + 2;
  const exifEntriesEnd = exifEntriesStart + exifEntryCount * 12;
  const exifNextOffset = exifEntriesEnd;
  const tiffEnd = exifNextOffset + 4;

  const tiff: number[] = new Array(tiffEnd).fill(0);

  const setU16 = (offset: number, value: number) => {
    tiff[offset] = value & 0xff;
    tiff[offset + 1] = (value >> 8) & 0xff;
  };
  const setU32 = (offset: number, value: number) => {
    tiff[offset] = value & 0xff;
    tiff[offset + 1] = (value >> 8) & 0xff;
    tiff[offset + 2] = (value >> 16) & 0xff;
    tiff[offset + 3] = (value >> 24) & 0xff;
  };
  const writeEntry = (
    entriesStart: number,
    index: number,
    tag: number,
    type: number,
    count: number,
    value: number,
  ) => {
    const base = entriesStart + index * 12;
    setU16(base, tag);
    setU16(base + 2, type);
    setU32(base + 4, count);
    setU32(base + 8, value);
  };

  tiff[0] = 0x49;
  tiff[1] = 0x49;
  setU16(2, 42);
  setU32(4, ifd0Start);
  setU16(ifd0Start, ifd0EntryCount);

  writeEntry(ifd0EntriesStart, 0, 0x010f, TIFF_ASCII, make.length, makeOffset);
  writeEntry(ifd0EntriesStart, 1, 0x0110, TIFF_ASCII, model.length, modelOffset);
  writeEntry(ifd0EntriesStart, 2, EXIF_IFD_POINTER, TIFF_LONG, 1, exifIfdStart);
  setU32(ifd0NextOffset, 0);

  make.forEach((byte, i) => (tiff[makeOffset + i] = byte));
  model.forEach((byte, i) => (tiff[modelOffset + i] = byte));

  setU16(exifIfdStart, exifEntryCount);
  writeEntry(exifEntriesStart, 0, 0x8827, TIFF_SHORT, 1, 100);
  writeEntry(exifEntriesStart, 1, 0x9201, TIFF_SHORT, 1, 1);
  setU32(exifNextOffset, 0);

  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  const payload = [...exifHeader, ...tiff];
  const length = payload.length + 2;

  return [0xff, 0xe1, (length >> 8) & 0xff, length & 0xff, ...payload];
}

async function makeJpegWithExif(): Promise<Blob> {
  const baseBuffer = await makeBaseJpeg(20, 20);
  const baseBytes = new Uint8Array(baseBuffer);
  const app1 = buildExifApp1();

  const combined = new Uint8Array(2 + app1.length + (baseBytes.length - 2));
  combined.set(baseBytes.subarray(0, 2), 0);
  combined.set(app1, 2);
  combined.set(baseBytes.subarray(2), 2 + app1.length);

  return new Blob([combined], { type: 'image/jpeg' });
}

describe('readMetadata', () => {
  it('extracts Make and Model from a real EXIF segment', async () => {
    const input = await makeJpegWithExif();
    const entries = await readMetadata(input);
    const make = entries.find((e) => e.label === 'Camera make');
    const model = entries.find((e) => e.label === 'Camera model');
    expect(make?.value).toBe('Bundle');
    expect(model?.value).toBe('Toolkit');
  });

  it('walks into the Exif sub-IFD for tags like ISO', async () => {
    const input = await makeJpegWithExif();
    const entries = await readMetadata(input);
    const iso = entries.find((e) => e.label === 'ISO');
    expect(iso?.value).toBe('100');
  });

  it('counts tags it does not recognize instead of dropping them silently', async () => {
    const input = await makeJpegWithExif();
    const entries = await readMetadata(input);
    const other = entries.find((e) => e.label === 'Other technical tags');
    expect(other).toBeDefined();
    expect(other?.value).toContain('1 more');
  });

  it('returns nothing for an image with no EXIF', async () => {
    const canvas = new OffscreenCanvas(20, 20);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('could not get 2d context');
    ctx.fillStyle = '#283b49';
    ctx.fillRect(0, 0, 20, 20);
    const input = await canvas.convertToBlob({ type: 'image/png' });
    const entries = await readMetadata(input);
    expect(entries).toEqual([]);
  });
});

describe('clearMetadata', () => {
  it('produces an image the original EXIF can no longer be read from', async () => {
    const input = await makeJpegWithExif();
    const before = await readMetadata(input);
    expect(before.length).toBeGreaterThan(0);

    const output = await clearMetadata(input, { mimeType: 'image/jpeg' });
    const after = await readMetadata(output);
    expect(after).toEqual([]);
  });

  it('keeps the same pixel dimensions', async () => {
    const input = await makeJpegWithExif();
    const output = await clearMetadata(input, { mimeType: 'image/jpeg' });
    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(20);
    expect(bitmap.height).toBe(20);
  });
});

function indexOfScan(bytes: Uint8Array): number {
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xda) return i;
  }
  return -1;
}

async function withComment(blob: Blob, text: string): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const body = [...text].map((ch) => ch.charCodeAt(0));
  const length = body.length + 2;
  const segment = [0xff, 0xfe, (length >> 8) & 0xff, length & 0xff, ...body];
  const out = new Uint8Array(bytes.length + segment.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(segment, 2);
  out.set(bytes.subarray(2), 2 + segment.length);
  return new Blob([out], { type: 'image/jpeg' });
}

describe('readJpegRows', () => {
  it('lists recognized tags, blank editable rows and the unknown-tag count', async () => {
    const rows = await readJpegRows(await makeJpegWithExif());
    const byLabel = Object.fromEntries((rows ?? []).map((r) => [r.label, r]));

    expect(byLabel['Camera make'].value).toBe('Bundle');
    expect(byLabel['Camera make'].editable).toBe(true);
    expect(byLabel['ISO'].value).toBe('100');
    expect(byLabel['ISO'].editable).toBe(false);
    expect(byLabel['Artist'].value).toBe('');
    expect(byLabel['Copyright'].editable).toBe(true);
    expect(byLabel['Other technical tags'].selectable).toBe(false);
  });

  it('returns null for a non-JPEG', async () => {
    const canvas = new OffscreenCanvas(10, 10);
    canvas.getContext('2d');
    expect(await readJpegRows(await canvas.convertToBlob({ type: 'image/png' }))).toBeNull();
  });

  it('surfaces a comment segment', async () => {
    const input = await withComment(new Blob([await makeBaseJpeg(20, 20)]), 'shot in Paris');
    const rows = await readJpegRows(input);
    expect(rows?.find((r) => r.key === 'comment')?.value).toBe('shot in Paris');
  });
});

describe('rewriteJpeg', () => {
  it('clears everything without re-encoding the picture data', async () => {
    const input = await makeJpegWithExif();
    const output = await rewriteJpeg(input, {});

    expect(await readMetadata(output)).toEqual([]);

    const before = new Uint8Array(await input.arrayBuffer());
    const after = new Uint8Array(await output.arrayBuffer());
    expect(after.slice(indexOfScan(after))).toEqual(before.slice(indexOfScan(before)));

    const bitmap = await createImageBitmap(output);
    expect(bitmap.width).toBe(20);
    expect(bitmap.height).toBe(20);
  });

  it('keeps only the ticked tags', async () => {
    const output = await rewriteJpeg(await makeJpegWithExif(), {
      keep: ['exif:010f', 'exif:8827'],
    });
    const labels = (await readMetadata(output)).map((e) => e.label);

    expect(labels).toEqual(['Camera make', 'ISO']);
    expect((await readMetadata(output))[0].value).toBe('Bundle');
  });

  it('edits an existing tag and adds a missing one', async () => {
    const output = await rewriteJpeg(await makeJpegWithExif(), {
      keep: ['exif:0110'],
      edits: { 'exif:010f': 'Edited Make', 'exif:013b': 'Jane Doe', 'exif:8298': '(c) 2026 Jane' },
    });
    const byLabel = Object.fromEntries((await readMetadata(output)).map((e) => [e.label, e.value]));

    expect(byLabel['Camera make']).toBe('Edited Make');
    expect(byLabel['Camera model']).toBe('Toolkit');
    expect(byLabel['Artist']).toBe('Jane Doe');
    expect(byLabel['Copyright']).toBe('(c) 2026 Jane');
    expect(byLabel['ISO']).toBeUndefined();
  });

  it('writes EXIF into a JPEG that had none', async () => {
    const base = new Blob([await makeBaseJpeg(20, 20)], { type: 'image/jpeg' });
    const output = await rewriteJpeg(base, { edits: { 'exif:013b': 'Only Me' } });

    expect(await readMetadata(output)).toEqual([{ label: 'Artist', value: 'Only Me' }]);
    expect((await createImageBitmap(output)).width).toBe(20);
  });

  it('removes a tag when its edit is blank', async () => {
    const output = await rewriteJpeg(await makeJpegWithExif(), {
      keep: ['exif:010f', 'exif:0110'],
      edits: { 'exif:010f': '  ' },
    });
    expect((await readMetadata(output)).map((e) => e.label)).toEqual(['Camera model']);
  });

  it('keeps unicode text in an edited tag', async () => {
    const output = await rewriteJpeg(await makeJpegWithExif(), {
      edits: { 'exif:013b': 'Zoë' },
    });
    const rows = await readJpegRows(output);
    expect(rows?.find((r) => r.key === 'exif:013b')?.value).toBe('Zoë');
  });

  it('drops a comment unless ticked', async () => {
    const input = await withComment(await makeJpegWithExif(), 'secret note');

    const cleared = await rewriteJpeg(input, {});
    expect((await readJpegRows(cleared))?.some((r) => r.key === 'comment')).toBe(false);

    const kept = await rewriteJpeg(input, { keep: ['comment'] });
    expect((await readJpegRows(kept))?.find((r) => r.key === 'comment')?.value).toBe('secret note');
  });

  it('ignores edits to keys it does not own', async () => {
    const output = await rewriteJpeg(await makeJpegWithExif(), {
      edits: { 'exif:8827': '400', xmp: 'x', 'exif:zzzz': 'y' },
    });
    expect(await readMetadata(output)).toEqual([]);
  });
});

describe('rewriteMetadata', () => {
  it('falls back to a full clear for a PNG', async () => {
    const canvas = new OffscreenCanvas(12, 12);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('could not get 2d context');
    ctx.fillRect(0, 0, 12, 12);
    const input = await canvas.convertToBlob({ type: 'image/png' });

    const output = await rewriteMetadata(input, { keep: ['exif:010f'] });
    expect(output.type).toBe('image/png');
    expect((await createImageBitmap(output)).width).toBe(12);
  });
});
