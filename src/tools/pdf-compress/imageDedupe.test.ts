import { describe, it, expect } from 'vitest';
import { PDFDocument, PDFRawStream, PDFName, PDFRef } from 'pdf-lib';
import { findDuplicateMap, replaceDuplicateReferences } from './imageDedupe';

async function makePhoto(seed: number, width = 200, height = 200): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('makePhoto: could not get 2d context');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${seed} 70% 40%)`);
  gradient.addColorStop(1, `hsl(${(seed + 180) % 360} 70% 40%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `hsl(${(seed + i * 7) % 360} 80% 50%)`;
    ctx.fillRect((i * 37 + seed) % width, (i * 53 + seed) % height, 8, 8);
  }
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
  return new Uint8Array(await blob.arrayBuffer());
}

function collectImages(doc: PDFDocument): [PDFRef, PDFRawStream][] {
  const SUBTYPE = PDFName.of('Subtype');
  const IMAGE = PDFName.of('Image');
  const out: [PDFRef, PDFRawStream][] = [];
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (object instanceof PDFRawStream && object.dict.get(SUBTYPE) === IMAGE) {
      out.push([ref, object]);
    }
  }
  return out;
}

describe('findDuplicateMap', () => {
  it('maps a second copy of the same picture back to the first', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const photo = await makePhoto(120);

    const first = await doc.embedJpg(photo);
    const second = await doc.embedJpg(photo);
    page.drawImage(first, { x: 0, y: 0, width: 100, height: 100 });
    page.drawImage(second, { x: 100, y: 100, width: 100, height: 100 });

    const bytes = await doc.save();
    const reloaded = await PDFDocument.load(bytes);
    const images = collectImages(reloaded);

    const duplicates = await findDuplicateMap(images);
    expect(duplicates.size).toBe(1);
  });

  it('never merges two genuinely different pictures', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);

    const first = await doc.embedJpg(await makePhoto(10));
    const second = await doc.embedJpg(await makePhoto(250));
    page.drawImage(first, { x: 0, y: 0, width: 100, height: 100 });
    page.drawImage(second, { x: 100, y: 100, width: 100, height: 100 });

    const bytes = await doc.save();
    const reloaded = await PDFDocument.load(bytes);
    const images = collectImages(reloaded);

    const duplicates = await findDuplicateMap(images);
    expect(duplicates.size).toBe(0);
  });

  it('leaves three distinct pictures alone even when two others match', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const repeated = await makePhoto(60);

    const a = await doc.embedJpg(repeated);
    const b = await doc.embedJpg(repeated);
    const c = await doc.embedJpg(await makePhoto(300));
    page.drawImage(a, { x: 0, y: 0, width: 50, height: 50 });
    page.drawImage(b, { x: 50, y: 50, width: 50, height: 50 });
    page.drawImage(c, { x: 100, y: 100, width: 50, height: 50 });

    const bytes = await doc.save();
    const reloaded = await PDFDocument.load(bytes);
    const images = collectImages(reloaded);

    const duplicates = await findDuplicateMap(images);
    expect(duplicates.size).toBe(1);
  });
});

describe('replaceDuplicateReferences', () => {
  it('repoints every reference to a duplicate at its canonical ref', async () => {
    const doc = await PDFDocument.create();
    const pageOne = doc.addPage([200, 200]);
    const pageTwo = doc.addPage([200, 200]);
    const photo = await makePhoto(80);

    const first = await doc.embedJpg(photo);
    const second = await doc.embedJpg(photo);
    pageOne.drawImage(first, { x: 0, y: 0, width: 100, height: 100 });
    pageTwo.drawImage(second, { x: 0, y: 0, width: 100, height: 100 });

    const bytes = await doc.save();
    const reloaded = await PDFDocument.load(bytes);
    const images = collectImages(reloaded);
    const duplicates = await findDuplicateMap(images);

    replaceDuplicateReferences(reloaded.context, reloaded.context.trailerInfo.Root, duplicates);

    const [duplicateTag, canonicalRef] = [...duplicates.entries()][0];
    const pageResources = reloaded.getPages().map((p) => p.node.normalizedEntries().XObject);
    for (const xobj of pageResources) {
      if (!xobj) continue;
      for (const [, ref] of xobj.entries()) {
        if (ref instanceof PDFRef) expect(ref.tag).not.toBe(duplicateTag);
      }
    }
    expect(canonicalRef).toBeDefined();
  });
});
