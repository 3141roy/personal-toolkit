import {
  clearMetadata,
  EXIF_IFD_POINTER,
  EXIF_SUBIFD_TAGS,
  findExifTiffStart,
  formatTagValue,
  GPS_IFD_POINTER,
  IFD0_TAGS,
  isExifHeader,
  readGpsLocation,
  readIfdEntries,
  resolveValueOffset,
  TYPE_SIZES,
  type MetadataProgress,
} from './metadata';

export interface MetadataRow {
  key: string;
  label: string;
  value: string;
  editable: boolean;
  selectable: boolean;
  defaultKept: boolean;
}

export interface RewriteOptions {
  keep?: string[];
  edits?: Record<string, string>;
}

interface TagEntry {
  tag: number;
  type: number;
  count: number;
  bytes: Uint8Array;
}

interface ExifModel {
  littleEndian: boolean;
  ifd0: TagEntry[];
  exif: TagEntry[];
  gps: TagEntry[];
  gpsLocation: string | null;
  unknown: number;
}

interface Segment {
  marker: number;
  start: number;
  end: number;
}

type SegmentKind = 'exif' | 'xmp' | 'iptc' | 'comment' | 'drop' | null;

const SOI = 0xffd8;
const SOS = 0xffda;
const APP0 = 0xffe0;
const APP1 = 0xffe1;
const APP13 = 0xffed;
const COM = 0xfffe;
const TYPE_ASCII = 2;
const TYPE_LONG = 4;

const ORIENTATION = 0x0112;
const IFD0_ASCII = [0x010e, 0x010f, 0x0110, 0x0131, 0x0132, 0x013b, 0x8298];
const EXIF_ASCII = [0x9003, 0xa434];
const EDITABLE_TAGS = new Set([...IFD0_ASCII, ...EXIF_ASCII]);
const BLANK_TAGS = [0x010e, 0x013b, 0x8298];
const ROW_ORDER = [
  0x010e,
  0x010f,
  0x0110,
  0x013b,
  0x8298,
  0x0131,
  0x0132,
  0x9003,
  ORIENTATION,
  0x829a,
  0x829d,
  0x8827,
  0x920a,
  0xa434,
];

const tagKey = (tag: number) => `exif:${tag.toString(16).padStart(4, '0')}`;
const tagFromKey = (key: string): number | null => {
  const match = /^exif:([0-9a-f]{4})$/.exec(key);
  return match ? parseInt(match[1], 16) : null;
};

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function startsWithAscii(view: DataView, offset: number, text: string): boolean {
  if (offset + text.length > view.byteLength) return false;
  for (let i = 0; i < text.length; i++) {
    if (view.getUint8(offset + i) !== text.charCodeAt(i)) return false;
  }
  return true;
}

function isJpeg(view: DataView): boolean {
  return view.byteLength >= 4 && view.getUint16(0) === SOI;
}

function listSegments(view: DataView): { segments: Segment[]; scanStart: number } {
  const segments: Segment[] = [];
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00 || marker === SOS) break;
    const end = offset + 2 + view.getUint16(offset + 2);
    if (end > view.byteLength) break;
    segments.push({ marker, start: offset, end });
    offset = end;
  }
  return { segments, scanStart: offset };
}

function kindOf(view: DataView, segment: Segment): SegmentKind {
  if (segment.marker === COM) return 'comment';
  if (segment.marker === APP13) return 'iptc';
  if (segment.marker !== APP1) return null;
  if (segment.end - segment.start >= 10 && isExifHeader(view, segment.start + 4)) return 'exif';
  if (startsWithAscii(view, segment.start + 4, 'http://ns.adobe.com/x')) return 'xmp';
  return 'drop';
}

function toEntry(
  view: DataView,
  tiffStart: number,
  raw: ReturnType<typeof readIfdEntries>[number],
  littleEndian: boolean,
): TagEntry | null {
  const size = (TYPE_SIZES[raw.type] ?? 1) * raw.count;
  const at = resolveValueOffset(view, tiffStart, raw, littleEndian);
  if (at + size > view.byteLength) return null;
  const bytes = new Uint8Array(view.buffer, view.byteOffset + at, size).slice();
  return { tag: raw.tag, type: raw.type, count: raw.count, bytes };
}

function readModel(view: DataView, segments: Segment[]): ExifModel {
  const empty: ExifModel = {
    littleEndian: true,
    ifd0: [],
    exif: [],
    gps: [],
    gpsLocation: null,
    unknown: 0,
  };

  try {
    const exifSegment = segments.find((segment) => kindOf(view, segment) === 'exif');
    if (!exifSegment) return empty;

    const tiffStart = findExifTiffStart(view);
    if (tiffStart === null) return empty;
    const littleEndian = view.getUint16(tiffStart) === 0x4949;
    if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return empty;

    const model: ExifModel = { ...empty, littleEndian };
    const ifd0 = readIfdEntries(
      view,
      tiffStart + view.getUint32(tiffStart + 4, littleEndian),
      littleEndian,
    );

    const collect = (raws: typeof ifd0, known: Record<number, unknown>, into: TagEntry[]): void => {
      for (const raw of raws) {
        if (raw.tag === EXIF_IFD_POINTER || raw.tag === GPS_IFD_POINTER) continue;
        const entry = toEntry(view, tiffStart, raw, littleEndian);
        if (entry && known[raw.tag]) into.push(entry);
        else model.unknown++;
      }
    };

    collect(ifd0, IFD0_TAGS, model.ifd0);

    const exifPointer = ifd0.find((entry) => entry.tag === EXIF_IFD_POINTER);
    if (exifPointer) {
      const offset = tiffStart + view.getUint32(exifPointer.valueOffset, littleEndian);
      collect(readIfdEntries(view, offset, littleEndian), EXIF_SUBIFD_TAGS, model.exif);
    }

    const gpsPointer = ifd0.find((entry) => entry.tag === GPS_IFD_POINTER);
    if (gpsPointer) {
      const offset = tiffStart + view.getUint32(gpsPointer.valueOffset, littleEndian);
      for (const raw of readIfdEntries(view, offset, littleEndian)) {
        const entry = toEntry(view, tiffStart, raw, littleEndian);
        if (entry) model.gps.push(entry);
      }
      model.gpsLocation = readGpsLocation(view, tiffStart, offset, littleEndian);
    }

    return model;
  } catch {
    return empty;
  }
}

export async function readJpegRows(input: Blob): Promise<MetadataRow[] | null> {
  const view = new DataView(await input.arrayBuffer());
  if (!isJpeg(view)) return null;

  const { segments } = listSegments(view);
  const model = readModel(view, segments);
  const rows: MetadataRow[] = [];

  const addTagRows = (entries: TagEntry[], known: Record<number, { type: never }>): void => {
    for (const entry of entries) {
      const def = known[entry.tag] as unknown as Parameters<typeof formatTagValue>[3] & {
        label: string;
      };
      const bytes = new DataView(entry.bytes.buffer, entry.bytes.byteOffset, entry.bytes.length);
      let value = '';
      try {
        value = formatTagValue(bytes, 0, entry.count, def, model.littleEndian);
      } catch {
        value = '';
      }
      if (value === '') continue;
      rows.push({
        key: tagKey(entry.tag),
        label: def.label,
        value,
        editable: EDITABLE_TAGS.has(entry.tag),
        selectable: true,
        defaultKept: entry.tag === ORIENTATION,
      });
    }
  };

  addTagRows(model.ifd0, IFD0_TAGS as never);
  addTagRows(model.exif, EXIF_SUBIFD_TAGS as never);

  for (const tag of BLANK_TAGS) {
    if (rows.some((row) => row.key === tagKey(tag))) continue;
    rows.push({
      key: tagKey(tag),
      label: IFD0_TAGS[tag].label,
      value: '',
      editable: true,
      selectable: true,
      defaultKept: false,
    });
  }

  rows.sort(
    (a, b) => ROW_ORDER.indexOf(tagFromKey(a.key)!) - ROW_ORDER.indexOf(tagFromKey(b.key)!),
  );

  if (model.gps.length > 0) {
    rows.push({
      key: 'gps',
      label: 'Location',
      value: model.gpsLocation ?? 'present',
      editable: false,
      selectable: true,
      defaultKept: false,
    });
  }

  const decoder = new TextDecoder();
  for (const segment of segments) {
    const kind = kindOf(view, segment);
    const size = segment.end - segment.start - 4;
    if (kind === 'xmp') {
      rows.push({
        key: 'xmp',
        label: 'Embedded XMP',
        value: formatBytes(size),
        editable: false,
        selectable: true,
        defaultKept: false,
      });
    } else if (kind === 'iptc') {
      rows.push({
        key: 'iptc',
        label: 'IPTC / Photoshop',
        value: formatBytes(size),
        editable: false,
        selectable: true,
        defaultKept: false,
      });
    } else if (kind === 'comment') {
      const text = decoder.decode(new Uint8Array(view.buffer, segment.start + 4, size)).trim();
      rows.push({
        key: 'comment',
        label: 'Comment',
        value: text.slice(0, 80) || 'present',
        editable: false,
        selectable: true,
        defaultKept: false,
      });
    }
  }

  if (model.unknown > 0) {
    rows.push({
      key: 'unknown',
      label: 'Other technical tags',
      value: `${model.unknown} more, always cleared`,
      editable: false,
      selectable: false,
      defaultKept: false,
    });
  }

  return rows;
}

function asciiEntry(tag: number, text: string): TagEntry {
  const encoded = new TextEncoder().encode(text);
  const bytes = new Uint8Array(encoded.length + 1);
  bytes.set(encoded);
  return { tag, type: TYPE_ASCII, count: bytes.length, bytes };
}

function buildTiff(
  littleEndian: boolean,
  ifd0: TagEntry[],
  exif: TagEntry[],
  gps: TagEntry[],
): Uint8Array {
  const pointers = new Map<TagEntry, 'exif' | 'gps'>();
  const top = [...ifd0];
  if (exif.length > 0) {
    const entry = { tag: EXIF_IFD_POINTER, type: TYPE_LONG, count: 1, bytes: new Uint8Array(0) };
    pointers.set(entry, 'exif');
    top.push(entry);
  }
  if (gps.length > 0) {
    const entry = { tag: GPS_IFD_POINTER, type: TYPE_LONG, count: 1, bytes: new Uint8Array(0) };
    pointers.set(entry, 'gps');
    top.push(entry);
  }

  const ifds = [top, exif, gps].map((list) => [...list].sort((a, b) => a.tag - b.tag));
  const ifdSize = (list: TagEntry[]) => (list.length > 0 ? 2 + list.length * 12 + 4 : 0);
  const offsets = [8, 0, 0];
  offsets[1] = offsets[0] + ifdSize(ifds[0]);
  offsets[2] = offsets[1] + ifdSize(ifds[1]);
  let cursor = offsets[2] + ifdSize(ifds[2]);

  const dataAt = new Map<TagEntry, number>();
  for (const list of ifds) {
    for (const entry of list) {
      if (entry.bytes.length <= 4) continue;
      dataAt.set(entry, cursor);
      cursor += entry.bytes.length + (entry.bytes.length & 1);
    }
  }

  const out = new Uint8Array(cursor);
  const view = new DataView(out.buffer);
  out[0] = out[1] = littleEndian ? 0x49 : 0x4d;
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);

  ifds.forEach((list, index) => {
    if (list.length === 0) return;
    const base = offsets[index];
    view.setUint16(base, list.length, littleEndian);
    list.forEach((entry, i) => {
      const at = base + 2 + i * 12;
      view.setUint16(at, entry.tag, littleEndian);
      view.setUint16(at + 2, entry.type, littleEndian);
      view.setUint32(at + 4, entry.count, littleEndian);
      const pointer = pointers.get(entry);
      if (pointer) {
        view.setUint32(at + 8, pointer === 'exif' ? offsets[1] : offsets[2], littleEndian);
      } else if (entry.bytes.length <= 4) {
        out.set(entry.bytes, at + 8);
      } else {
        const dataOffset = dataAt.get(entry)!;
        view.setUint32(at + 8, dataOffset, littleEndian);
        out.set(entry.bytes, dataOffset);
      }
    });
  });

  return out;
}

function buildApp1(tiff: Uint8Array): Uint8Array {
  const length = 2 + 6 + tiff.length;
  if (length > 0xffff) throw new Error('rewriteJpeg: metadata too large for one segment');
  const out = new Uint8Array(2 + length);
  out.set([0xff, 0xe1, length >> 8, length & 0xff, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
  out.set(tiff, 10);
  return out;
}

export async function rewriteJpeg(
  input: Blob,
  opts: RewriteOptions = {},
  onProgress?: MetadataProgress,
): Promise<Blob> {
  const buffer = await input.arrayBuffer();
  const view = new DataView(buffer);
  if (!isJpeg(view)) throw new Error('rewriteJpeg: not a JPEG');

  const keep = new Set(opts.keep ?? []);
  const edits = opts.edits ?? {};
  onProgress?.(20);

  const { segments, scanStart } = listSegments(view);
  const model = readModel(view, segments);

  const isReplaced = (tag: number) => EDITABLE_TAGS.has(tag) && tagKey(tag) in edits;
  const pick = (list: TagEntry[]) =>
    list.filter((entry) => keep.has(tagKey(entry.tag)) && !isReplaced(entry.tag));

  const ifd0 = pick(model.ifd0);
  const exif = pick(model.exif);
  for (const [key, value] of Object.entries(edits)) {
    const tag = tagFromKey(key);
    if (tag === null || !EDITABLE_TAGS.has(tag) || value.trim() === '') continue;
    (EXIF_ASCII.includes(tag) ? exif : ifd0).push(asciiEntry(tag, value));
  }
  const gps = keep.has('gps') ? model.gps : [];
  onProgress?.(50);

  const hasExif = ifd0.length + exif.length + gps.length > 0;
  const app1 = hasExif ? buildApp1(buildTiff(model.littleEndian, ifd0, exif, gps)) : null;
  const keptKinds = new Set<SegmentKind>(
    (['xmp', 'iptc', 'comment'] as const).filter((kind) => keep.has(kind)),
  );

  const parts: BlobPart[] = [buffer.slice(0, 2)];
  let pending = app1;
  for (const segment of segments) {
    if (pending && segment.marker !== APP0) {
      parts.push(pending as BlobPart);
      pending = null;
    }
    const kind = kindOf(view, segment);
    if (kind === 'exif' || kind === 'drop') continue;
    if (kind && !keptKinds.has(kind)) continue;
    parts.push(buffer.slice(segment.start, segment.end));
  }
  if (pending) parts.push(pending as BlobPart);
  parts.push(buffer.slice(scanStart));

  onProgress?.(100);
  return new Blob(parts, { type: 'image/jpeg' });
}

export async function rewriteMetadata(
  input: Blob,
  opts: RewriteOptions = {},
  onProgress?: MetadataProgress,
): Promise<Blob> {
  const view = new DataView(await input.arrayBuffer());
  if (isJpeg(view)) return rewriteJpeg(input, opts, onProgress);
  return clearMetadata(input, { mimeType: input.type }, onProgress);
}
