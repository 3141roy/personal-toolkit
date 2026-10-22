import { PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, PDFStream, PDFString } from 'pdf-lib';
import type { PDFObject } from 'pdf-lib';

export interface MetadataEntry {
  key: string;
  label: string;
  value: string;
}

export type MetadataProgress = (percent: number) => void;

export interface StripOptions {
  keep?: string[];
  edits?: Record<string, string>;
}

export const XMP_KEY = 'xmp';
export const PIECE_INFO_KEY = 'pieceinfo';
export const infoKey = (name: string) => `info:${name}`;

const STANDARD_FIELDS = ['Title', 'Author', 'Subject', 'Keywords'];
const DATE_KEYS = ['CreationDate', 'ModDate'];

export function isEditable(key: string): boolean {
  return key.startsWith('info:') && !DATE_KEYS.includes(key.slice(5));
}

export function withBlankFields(entries: MetadataEntry[]): MetadataEntry[] {
  const present = new Set(entries.map((entry) => entry.key));
  const blanks = STANDARD_FIELDS.filter((name) => !present.has(infoKey(name))).map((name) => ({
    key: infoKey(name),
    label: INFO_LABELS[name],
    value: '',
  }));
  return [...entries, ...blanks].sort((a, b) => rank(a.key.slice(5)) - rank(b.key.slice(5)) || 0);
}

const INFO_LABELS: Record<string, string> = {
  Title: 'Title',
  Author: 'Author',
  Subject: 'Subject',
  Keywords: 'Keywords',
  Creator: 'Created with',
  Producer: 'Producer',
  CreationDate: 'Created',
  ModDate: 'Modified',
};

const INFO_ORDER = Object.keys(INFO_LABELS);
const METADATA = PDFName.of('Metadata');
const PIECE_INFO = PDFName.of('PieceInfo');
const LOAD_OPTIONS = { ignoreEncryption: true, updateMetadata: false };

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function formatPdfDate(raw: string): string {
  const match = /^D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?/.exec(raw);
  if (!match) return raw;
  const [, year, month, day, hour, minute] = match;
  return hour ? `${year}-${month}-${day} ${hour}:${minute ?? '00'}` : `${year}-${month}-${day}`;
}

function infoValue(value: PDFObject | undefined): string {
  if (value instanceof PDFString || value instanceof PDFHexString) return value.decodeText();
  return value ? value.toString() : '';
}

function rank(key: string): number {
  const index = INFO_ORDER.indexOf(key);
  return index === -1 ? INFO_ORDER.length : index;
}

async function load(input: Blob): Promise<PDFDocument> {
  return PDFDocument.load(new Uint8Array(await input.arrayBuffer()), LOAD_OPTIONS);
}

export async function readPdfMetadata(input: Blob): Promise<MetadataEntry[]> {
  const doc = await load(input);
  const entries: MetadataEntry[] = [];

  const infoRef = doc.context.trailerInfo.Info;
  const info = infoRef ? doc.context.lookupMaybe(infoRef, PDFDict) : undefined;
  if (info) {
    const pairs = info
      .entries()
      .map(([key, value]) => [key.decodeText(), infoValue(doc.context.lookup(value))] as const)
      .filter(([, value]) => value.trim() !== '')
      .sort((a, b) => rank(a[0]) - rank(b[0]));

    for (const [key, raw] of pairs) {
      const isDate = key === 'CreationDate' || key === 'ModDate';
      entries.push({
        key: infoKey(key),
        label: INFO_LABELS[key] ?? key,
        value: isDate ? formatPdfDate(raw) : raw,
      });
    }
  }

  const xmp = doc.catalog.lookupMaybe(METADATA, PDFStream);
  if (xmp) {
    entries.push({
      key: XMP_KEY,
      label: 'Embedded XMP',
      value: formatBytes(xmp.getContentsSize()),
    });
  }
  if (doc.catalog.has(PIECE_INFO)) {
    entries.push({ key: PIECE_INFO_KEY, label: 'App-private data', value: 'present' });
  }

  return entries;
}

export async function stripPdfMetadata(
  input: Blob,
  opts: StripOptions = {},
  onProgress?: MetadataProgress,
): Promise<Blob> {
  const keep = new Set(opts.keep ?? []);
  const doc = await load(input);
  const { context } = doc;
  onProgress?.(30);

  const edits = opts.edits ?? {};
  const infoRef = context.trailerInfo.Info;
  let info = infoRef ? context.lookupMaybe(infoRef, PDFDict) : undefined;
  if (info) {
    for (const name of info.keys()) {
      const key = infoKey(name.decodeText());
      if (!keep.has(key) && !(isEditable(key) && key in edits)) info.delete(name);
    }
  }
  for (const [key, value] of Object.entries(edits)) {
    if (!isEditable(key)) continue;
    const name = PDFName.of(key.slice(5));
    if (value.trim() === '') {
      info?.delete(name);
      continue;
    }
    if (!info) {
      info = context.obj({});
      context.trailerInfo.Info = context.register(info);
    }
    info.set(name, PDFHexString.fromText(value));
  }
  if (!info || info.keys().length === 0) {
    const current = context.trailerInfo.Info;
    if (current instanceof PDFRef) context.delete(current);
    context.trailerInfo.Info = undefined;
  }

  const keptOnCatalog = new Map([
    [METADATA, keep.has(XMP_KEY)],
    [PIECE_INFO, keep.has(PIECE_INFO_KEY)],
  ]);

  for (const [, object] of context.enumerateIndirectObjects()) {
    const dict =
      object instanceof PDFDict ? object : object instanceof PDFStream ? object.dict : undefined;
    if (!dict) continue;

    for (const key of [METADATA, PIECE_INFO]) {
      if (dict === doc.catalog && keptOnCatalog.get(key)) continue;
      const value = dict.get(key);
      if (value instanceof PDFRef) context.delete(value);
      dict.delete(key);
    }
  }
  onProgress?.(60);

  const bytes = await doc.save();
  onProgress?.(100);
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}
