import {
  PDFArray,
  PDFDict,
  PDFRef,
  PDFStream,
  type PDFContext,
  type PDFObject,
  type PDFRawStream,
} from 'pdf-lib';
import { decodeToBitmap } from './imageDecode';

const THUMB_SIZE = 24;
const DIFFERENCE_THRESHOLD = 3;

async function buildThumbprint(bitmap: ImageBitmap): Promise<Uint8ClampedArray | null> {
  const canvas = new OffscreenCanvas(THUMB_SIZE, THUMB_SIZE);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, THUMB_SIZE, THUMB_SIZE);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, THUMB_SIZE, THUMB_SIZE);
  const gray = new Uint8ClampedArray(THUMB_SIZE * THUMB_SIZE);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return gray;
}

function meanDifference(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / a.length;
}

export async function findDuplicateMap(
  images: [PDFRef, PDFRawStream][],
): Promise<Map<string, PDFRef>> {
  const thumbprints: { ref: PDFRef; thumb: Uint8ClampedArray }[] = [];

  for (const [ref, stream] of images) {
    const bitmap = await decodeToBitmap(stream);
    if (!bitmap) continue;
    const thumb = await buildThumbprint(bitmap);
    if (thumb) thumbprints.push({ ref, thumb });
  }

  const duplicates = new Map<string, PDFRef>();
  const claimed = new Set<string>();

  for (let i = 0; i < thumbprints.length; i++) {
    const a = thumbprints[i];
    if (claimed.has(a.ref.tag)) continue;

    for (let j = i + 1; j < thumbprints.length; j++) {
      const b = thumbprints[j];
      if (claimed.has(b.ref.tag)) continue;
      if (meanDifference(a.thumb, b.thumb) > DIFFERENCE_THRESHOLD) continue;

      duplicates.set(b.ref.tag, a.ref);
      claimed.add(b.ref.tag);
    }
  }

  return duplicates;
}

function retarget(
  context: PDFContext,
  object: PDFObject | undefined,
  duplicates: Map<string, PDFRef>,
  visited: Set<string>,
): void {
  if (!object) return;

  if (object instanceof PDFRef) {
    if (visited.has(object.tag)) return;
    visited.add(object.tag);
    retarget(context, context.lookup(object), duplicates, visited);
    return;
  }

  if (object instanceof PDFDict) {
    for (const [key, value] of object.entries()) {
      if (value instanceof PDFRef) {
        const canonical = duplicates.get(value.tag);
        if (canonical) {
          object.set(key, canonical);
        } else {
          retarget(context, value, duplicates, visited);
        }
      } else {
        retarget(context, value, duplicates, visited);
      }
    }
    return;
  }

  if (object instanceof PDFArray) {
    for (let i = 0; i < object.size(); i++) {
      const value = object.get(i);
      if (value instanceof PDFRef) {
        const canonical = duplicates.get(value.tag);
        if (canonical) {
          object.set(i, canonical);
        } else {
          retarget(context, value, duplicates, visited);
        }
      } else {
        retarget(context, value, duplicates, visited);
      }
    }
    return;
  }

  if (object instanceof PDFStream) {
    retarget(context, object.dict, duplicates, visited);
  }
}

export function replaceDuplicateReferences(
  context: PDFContext,
  root: PDFObject | undefined,
  duplicates: Map<string, PDFRef>,
): void {
  if (duplicates.size === 0) return;
  retarget(context, root, duplicates, new Set());
}
