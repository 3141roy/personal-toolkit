export interface MetadataEntry {
  label: string;
  value: string;
}

export interface ClearMetadataOptions {
  mimeType?: string;
  quality?: number;
}

export type MetadataProgress = (percent: number) => void;

const JPEG_SOI = 0xffd8;
const APP1_MARKER = 0xffe1;
const START_OF_SCAN = 0xffda;

const EXIF_IFD_POINTER = 0x8769;
const GPS_IFD_POINTER = 0x8825;

const GPS_LAT_REF = 0x0001;
const GPS_LAT = 0x0002;
const GPS_LON_REF = 0x0003;
const GPS_LON = 0x0004;

const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 };

type TagType = 'ascii' | 'short' | 'rational';

const IFD0_TAGS: Record<number, { label: string; type: TagType }> = {
  0x010f: { label: 'Camera make', type: 'ascii' },
  0x0110: { label: 'Camera model', type: 'ascii' },
  0x0112: { label: 'Orientation', type: 'short' },
  0x0131: { label: 'Software', type: 'ascii' },
  0x0132: { label: 'Date taken', type: 'ascii' },
};

const EXIF_SUBIFD_TAGS: Record<number, { label: string; type: TagType; unit?: string }> = {
  0x9003: { label: 'Date taken (original)', type: 'ascii' },
  0x829a: { label: 'Exposure time', type: 'rational', unit: 's' },
  0x829d: { label: 'F-number', type: 'rational', unit: 'f/' },
  0x8827: { label: 'ISO', type: 'short' },
  0x920a: { label: 'Focal length', type: 'rational', unit: 'mm' },
  0xa434: { label: 'Lens model', type: 'ascii' },
};

const IFD_POINTER_TAGS = new Set([EXIF_IFD_POINTER, GPS_IFD_POINTER]);

interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  valueOffset: number;
}

export async function readMetadata(input: Blob): Promise<MetadataEntry[]> {
  const buffer = await input.arrayBuffer();
  const view = new DataView(buffer);

  if (view.byteLength < 4 || view.getUint16(0) !== JPEG_SOI) {
    return [];
  }

  const tiffStart = findExifTiffStart(view);
  if (tiffStart === null) return [];

  const littleEndian = view.getUint16(tiffStart) === 0x4949;
  if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return [];

  const ifd0Offset = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
  const ifd0Entries = readIfdEntries(view, ifd0Offset, littleEndian);

  const ifd0 = decodeKnownTags(view, tiffStart, ifd0Entries, IFD0_TAGS, littleEndian);
  const result: MetadataEntry[] = [...ifd0.recognized];
  let unrecognizedCount = ifd0.unrecognizedCount;

  const exifIfdEntry = ifd0Entries.find((entry) => entry.tag === EXIF_IFD_POINTER);
  if (exifIfdEntry) {
    const exifIfdOffset = tiffStart + view.getUint32(exifIfdEntry.valueOffset, littleEndian);
    const exifEntries = readIfdEntries(view, exifIfdOffset, littleEndian);
    const exif = decodeKnownTags(view, tiffStart, exifEntries, EXIF_SUBIFD_TAGS, littleEndian);
    result.push(...exif.recognized);
    unrecognizedCount += exif.unrecognizedCount;
  }

  const gpsIfdEntry = ifd0Entries.find((entry) => entry.tag === GPS_IFD_POINTER);
  if (gpsIfdEntry) {
    const gpsIfdOffset = tiffStart + view.getUint32(gpsIfdEntry.valueOffset, littleEndian);
    const location = readGpsLocation(view, tiffStart, gpsIfdOffset, littleEndian);
    if (location) result.push({ label: 'Location', value: location });
  }

  if (unrecognizedCount > 0) {
    result.push({
      label: 'Other technical tags',
      value: `${unrecognizedCount} more, also cleared`,
    });
  }

  return result;
}

export async function readAllTags(input: Blob): Promise<MetadataEntry[]> {
  const buffer = await input.arrayBuffer();
  const view = new DataView(buffer);

  if (view.byteLength < 4 || view.getUint16(0) !== JPEG_SOI) return [];

  const tiffStart = findExifTiffStart(view);
  if (tiffStart === null) return [];

  const littleEndian = view.getUint16(tiffStart) === 0x4949;
  if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return [];

  const ifd0Offset = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
  const ifd0Entries = readIfdEntries(view, ifd0Offset, littleEndian);

  const result = decodeAllEntries(view, tiffStart, ifd0Entries, IFD0_TAGS, littleEndian);

  const exifIfdEntry = ifd0Entries.find((entry) => entry.tag === EXIF_IFD_POINTER);
  if (exifIfdEntry) {
    const exifIfdOffset = tiffStart + view.getUint32(exifIfdEntry.valueOffset, littleEndian);
    const exifEntries = readIfdEntries(view, exifIfdOffset, littleEndian);
    result.push(...decodeAllEntries(view, tiffStart, exifEntries, EXIF_SUBIFD_TAGS, littleEndian));
  }

  const gpsIfdEntry = ifd0Entries.find((entry) => entry.tag === GPS_IFD_POINTER);
  if (gpsIfdEntry) {
    const gpsIfdOffset = tiffStart + view.getUint32(gpsIfdEntry.valueOffset, littleEndian);
    const gpsEntries = readIfdEntries(view, gpsIfdOffset, littleEndian);
    result.push(...decodeAllEntries(view, tiffStart, gpsEntries, {}, littleEndian));
  }

  return result;
}

function decodeAllEntries(
  view: DataView,
  tiffStart: number,
  entries: IfdEntry[],
  tagMap: Record<number, { label: string; type: TagType; unit?: string }>,
  littleEndian: boolean,
): MetadataEntry[] {
  const result: MetadataEntry[] = [];

  for (const entry of entries) {
    if (IFD_POINTER_TAGS.has(entry.tag)) continue;

    const valueAt = resolveValueOffset(view, tiffStart, entry, littleEndian);
    const known = tagMap[entry.tag];

    if (known) {
      const value = formatTagValue(view, valueAt, entry.count, known, littleEndian);
      if (value) result.push({ label: known.label, value });
      continue;
    }

    const label = `Tag 0x${entry.tag.toString(16).padStart(4, '0')}`;
    const value = formatRawValue(view, valueAt, entry.count, entry.type, littleEndian);
    result.push({ label, value });
  }

  return result;
}

function formatRawValue(
  view: DataView,
  offset: number,
  count: number,
  type: number,
  littleEndian: boolean,
): string {
  if (type === 2) return readAscii(view, offset, count) || '(empty)';
  if (type === 3) return String(view.getUint16(offset, littleEndian));
  if (type === 4) return String(view.getUint32(offset, littleEndian));
  if (type === 5) return readRational(view, offset, littleEndian).toFixed(3);
  return `${count} byte${count === 1 ? '' : 's'} of data`;
}

function decodeKnownTags(
  view: DataView,
  tiffStart: number,
  entries: IfdEntry[],
  tagMap: Record<number, { label: string; type: TagType; unit?: string }>,
  littleEndian: boolean,
): { recognized: MetadataEntry[]; unrecognizedCount: number } {
  const recognized: MetadataEntry[] = [];
  let unrecognizedCount = 0;

  for (const entry of entries) {
    if (IFD_POINTER_TAGS.has(entry.tag)) continue;

    const known = tagMap[entry.tag];
    if (!known) {
      unrecognizedCount++;
      continue;
    }

    const valueAt = resolveValueOffset(view, tiffStart, entry, littleEndian);
    const value = formatTagValue(view, valueAt, entry.count, known, littleEndian);
    if (value) recognized.push({ label: known.label, value });
  }

  return { recognized, unrecognizedCount };
}

function formatTagValue(
  view: DataView,
  offset: number,
  count: number,
  known: { type: TagType; unit?: string },
  littleEndian: boolean,
): string {
  if (known.type === 'ascii') return readAscii(view, offset, count);
  if (known.type === 'short') return String(view.getUint16(offset, littleEndian));

  const rational = readRational(view, offset, littleEndian);
  if (known.unit === 's') {
    return rational > 0 && rational < 1
      ? `1/${Math.round(1 / rational)}s`
      : `${rational.toFixed(1)}s`;
  }
  if (known.unit === 'f/') return `f/${rational.toFixed(1)}`;
  if (known.unit === 'mm') return `${Math.round(rational)}mm`;
  return rational.toFixed(2);
}

export async function clearMetadata(
  input: Blob,
  opts: ClearMetadataOptions = {},
  onProgress?: MetadataProgress,
): Promise<Blob> {
  const mimeType = opts.mimeType ?? input.type ?? 'image/png';

  onProgress?.(10);
  const bitmap = await createImageBitmap(input);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('clearMetadata: could not get 2d context');
  }
  ctx.drawImage(bitmap, 0, 0);
  onProgress?.(70);

  const result = await canvas.convertToBlob({ type: mimeType, quality: opts.quality });
  onProgress?.(100);

  return result;
}

function findExifTiffStart(view: DataView): number | null {
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) break;
    if (marker === START_OF_SCAN) break;

    const length = view.getUint16(offset + 2);
    if (marker === APP1_MARKER) {
      const headerStart = offset + 4;
      if (isExifHeader(view, headerStart)) {
        return headerStart + 6;
      }
    }
    offset += 2 + length;
  }
  return null;
}

function isExifHeader(view: DataView, offset: number): boolean {
  return (
    view.getUint8(offset) === 0x45 &&
    view.getUint8(offset + 1) === 0x78 &&
    view.getUint8(offset + 2) === 0x69 &&
    view.getUint8(offset + 3) === 0x66 &&
    view.getUint8(offset + 4) === 0x00 &&
    view.getUint8(offset + 5) === 0x00
  );
}

function readIfdEntries(view: DataView, ifdOffset: number, littleEndian: boolean): IfdEntry[] {
  const entryCount = view.getUint16(ifdOffset, littleEndian);
  const entries: IfdEntry[] = [];
  for (let i = 0; i < entryCount; i++) {
    const base = ifdOffset + 2 + i * 12;
    entries.push({
      tag: view.getUint16(base, littleEndian),
      type: view.getUint16(base + 2, littleEndian),
      count: view.getUint32(base + 4, littleEndian),
      valueOffset: base + 8,
    });
  }
  return entries;
}

function resolveValueOffset(
  view: DataView,
  tiffStart: number,
  entry: IfdEntry,
  littleEndian: boolean,
): number {
  const size = (TYPE_SIZES[entry.type] ?? 1) * entry.count;
  if (size <= 4) return entry.valueOffset;
  return tiffStart + view.getUint32(entry.valueOffset, littleEndian);
}

function readAscii(view: DataView, offset: number, count: number): string {
  const bytes: number[] = [];
  for (let i = 0; i < count; i++) {
    const byte = view.getUint8(offset + i);
    if (byte === 0) break;
    bytes.push(byte);
  }
  return String.fromCharCode(...bytes).trim();
}

function readRational(view: DataView, offset: number, littleEndian: boolean): number {
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  return denominator === 0 ? 0 : numerator / denominator;
}

function readDmsToDecimal(view: DataView, offset: number, littleEndian: boolean): number {
  const degrees = readRational(view, offset, littleEndian);
  const minutes = readRational(view, offset + 8, littleEndian);
  const seconds = readRational(view, offset + 16, littleEndian);
  return degrees + minutes / 60 + seconds / 3600;
}

function readGpsLocation(
  view: DataView,
  tiffStart: number,
  gpsIfdOffset: number,
  littleEndian: boolean,
): string | null {
  const entries = readIfdEntries(view, gpsIfdOffset, littleEndian);
  let latRef = '';
  let lonRef = '';
  let lat: number | null = null;
  let lon: number | null = null;

  for (const entry of entries) {
    const valueAt = resolveValueOffset(view, tiffStart, entry, littleEndian);
    if (entry.tag === GPS_LAT_REF) latRef = readAscii(view, valueAt, entry.count);
    else if (entry.tag === GPS_LON_REF) lonRef = readAscii(view, valueAt, entry.count);
    else if (entry.tag === GPS_LAT) lat = readDmsToDecimal(view, valueAt, littleEndian);
    else if (entry.tag === GPS_LON) lon = readDmsToDecimal(view, valueAt, littleEndian);
  }

  if (lat === null || lon === null) return null;
  const latSigned = latRef === 'S' ? -lat : lat;
  const lonSigned = lonRef === 'W' ? -lon : lon;
  return `${latSigned.toFixed(5)}, ${lonSigned.toFixed(5)}`;
}
