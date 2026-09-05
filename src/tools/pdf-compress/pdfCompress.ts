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
import { decodeToBitmap, isJpegImage, rawBitmapInfo } from './imageDecode';
import { findDuplicateMap, replaceDuplicateReferences } from './imageDedupe';

export interface PdfCompressOptions {
  quality?: number;
}

export type PdfCompressProgress = (percent: number) => void;

const WIDTH = PDFName.of('Width');
const HEIGHT = PDFName.of('Height');
const COLOR_SPACE = PDFName.of('ColorSpace');
const BITS = PDFName.of('BitsPerComponent');
const FILTER = PDFName.of('Filter');
const DECODE = PDFName.of('Decode');
const DECODE_PARMS = PDFName.of('DecodeParms');

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

function collectImages(doc: PDFDocument): [PDFRef, PDFRawStream][] {
  const images: [PDFRef, PDFRawStream][] = [];
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (object instanceof PDFRawStream && (isJpegImage(object) || rawBitmapInfo(object))) {
      images.push([ref, object]);
    }
  }
  return images;
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
  onProgress?.(2);

  const duplicates = await findDuplicateMap(collectImages(doc));
  if (duplicates.size > 0) {
    replaceDuplicateReferences(doc.context, doc.context.trailerInfo.Root, duplicates);
    dropUnreachableObjects(doc);
  }
  onProgress?.(5);

  const images = collectImages(doc);

  for (let index = 0; index < images.length; index++) {
    const [ref, stream] = images[index];

    try {
      const bitmap = await decodeToBitmap(stream);
      const smaller = bitmap ? await encodeBitmap(bitmap, maxEdge, jpegQuality) : null;

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
