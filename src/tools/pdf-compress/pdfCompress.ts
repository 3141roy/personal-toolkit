import { PDFDocument, PDFName, PDFRawStream, type PDFRef } from 'pdf-lib';
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

async function reencode(
  jpeg: Uint8Array,
  maxEdge: number,
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const bitmap = await createImageBitmap(new Blob([jpeg.slice().buffer], { type: 'image/jpeg' }));
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

  const images: [PDFRef, PDFRawStream][] = [];
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (object instanceof PDFRawStream && isJpegImage(object)) {
      images.push([ref, object]);
    }
  }

  onProgress?.(5);

  for (let index = 0; index < images.length; index++) {
    const [ref, stream] = images[index];

    try {
      const smaller = await reencode(stream.contents, maxEdge, jpegQuality);
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
