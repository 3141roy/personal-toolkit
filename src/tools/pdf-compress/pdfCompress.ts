import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFStream,
  type PDFContext,
  type PDFObject,
} from 'pdf-lib';
import encodeJpeg from '@jsquash/jpeg/encode';

export interface PdfCompressOptions {
  quality?: number;
}

export type PdfCompressProgress = (percent: number) => void;

const IMAGE = PDFName.of('Image');
const SUBTYPE = PDFName.of('Subtype');
const FILTER = PDFName.of('Filter');
const WIDTH = PDFName.of('Width');
const HEIGHT = PDFName.of('Height');
const COLOR_SPACE = PDFName.of('ColorSpace');
const BITS = PDFName.of('BitsPerComponent');
const DECODE = PDFName.of('Decode');
const DECODE_PARMS = PDFName.of('DecodeParms');

function isJpegImage(stream: PDFRawStream): boolean {
  if (stream.dict.get(SUBTYPE) !== IMAGE) return false;
  const filter = stream.dict.get(FILTER);
  return filter !== undefined && filter.toString().includes('DCTDecode');
}

function flateRgbSize(stream: PDFRawStream): { width: number; height: number } | null {
  if (stream.dict.get(SUBTYPE) !== IMAGE) return null;
  if (stream.dict.get(FILTER)?.toString() !== '/FlateDecode') return null;
  if (stream.dict.get(DECODE_PARMS) !== undefined) return null;
  if (stream.dict.get(COLOR_SPACE)?.toString() !== '/DeviceRGB') return null;
  if (stream.dict.get(BITS)?.toString() !== '8') return null;

  const width = Number(stream.dict.get(WIDTH)?.toString());
  const height = Number(stream.dict.get(HEIGHT)?.toString());
  if (!width || !height) return null;
  return { width, height };
}

function markReachable(
  context: PDFContext,
  object: PDFObject | undefined,
  seen: Set<string>,
): void {
  if (!object) return;

  if (object instanceof PDFRef) {
    if (seen.has(object.tag)) return;
    seen.add(object.tag);
    markReachable(context, context.lookup(object), seen);
    return;
  }

  if (object instanceof PDFDict) {
    for (const value of object.values()) markReachable(context, value, seen);
    return;
  }

  if (object instanceof PDFArray) {
    for (const value of object.asArray()) markReachable(context, value, seen);
    return;
  }

  if (object instanceof PDFStream) {
    markReachable(context, object.dict, seen);
  }
}

function dropUnreachableObjects(doc: PDFDocument): void {
  const context = doc.context;
  const seen = new Set<string>();

  markReachable(context, context.trailerInfo.Root, seen);
  markReachable(context, context.trailerInfo.Info, seen);

  for (const [ref] of context.enumerateIndirectObjects()) {
    if (!seen.has(ref.tag)) context.delete(ref);
  }
}

async function encodeBitmap(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encoded = await encodeJpeg(ctx.getImageData(0, 0, width, height), { quality });
  return { bytes: new Uint8Array(encoded), width, height };
}

async function reencodeJpeg(
  jpeg: Uint8Array,
  maxEdge: number,
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const bitmap = await createImageBitmap(new Blob([jpeg.slice().buffer], { type: 'image/jpeg' }));
  return encodeBitmap(bitmap, maxEdge, quality);
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes.slice().buffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function reencodeFlateRgb(
  raw: Uint8Array,
  width: number,
  height: number,
  maxEdge: number,
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const rgb = await inflate(raw);
  if (rgb.length < width * height * 3) return null;

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += 3) {
    rgba[i * 4] = rgb[j];
    rgba[i * 4 + 1] = rgb[j + 1];
    rgba[i * 4 + 2] = rgb[j + 2];
    rgba[i * 4 + 3] = 255;
  }

  const bitmap = await createImageBitmap(new ImageData(rgba, width, height));
  return encodeBitmap(bitmap, maxEdge, quality);
}

export async function compressPdf(
  input: Blob,
  opts: PdfCompressOptions = {},
  onProgress?: PdfCompressProgress,
): Promise<Blob> {
  const quality = opts.quality ?? 0.75;
  const jpegQuality = Math.round(Math.min(95, Math.max(20, quality * 100)));
  const maxEdge = Math.round(800 + quality * 1600);

  const original = new Uint8Array(await input.arrayBuffer());
  const doc = await PDFDocument.load(original, { ignoreEncryption: true });

  dropUnreachableObjects(doc);

  const images: [PDFRef, PDFRawStream][] = [];
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (object instanceof PDFRawStream && (isJpegImage(object) || flateRgbSize(object))) {
      images.push([ref, object]);
    }
  }

  onProgress?.(5);

  for (let index = 0; index < images.length; index++) {
    const [ref, stream] = images[index];

    try {
      const flate = flateRgbSize(stream);
      const smaller = flate
        ? await reencodeFlateRgb(stream.contents, flate.width, flate.height, maxEdge, jpegQuality)
        : await reencodeJpeg(stream.contents, maxEdge, jpegQuality);

      if (smaller && smaller.bytes.length < stream.contents.length) {
        const dict = stream.dict;
        dict.set(WIDTH, doc.context.obj(smaller.width));
        dict.set(HEIGHT, doc.context.obj(smaller.height));
        dict.set(COLOR_SPACE, PDFName.of('DeviceRGB'));
        dict.set(BITS, doc.context.obj(8));
        dict.set(FILTER, PDFName.of('DCTDecode'));
        dict.delete(DECODE);
        dict.delete(DECODE_PARMS);
        doc.context.assign(ref, PDFRawStream.of(dict, smaller.bytes));
      }
    } catch {
      continue;
    }

    onProgress?.(5 + Math.round(((index + 1) / images.length) * 90));
  }

  const bytes = await doc.save({ useObjectStreams: true });
  onProgress?.(100);

  const output = bytes.length < original.length ? bytes : original;
  return new Blob([output.slice().buffer], { type: 'application/pdf' });
}
