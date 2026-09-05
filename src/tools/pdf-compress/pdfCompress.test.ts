import { describe, it, expect } from 'vitest';
import { PDFDocument, PDFName, PDFRawStream, StandardFonts } from 'pdf-lib';
import { compressPdf } from './pdfCompress';

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes.slice().buffer])
    .stream()
    .pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function makeFlateRgbImagePdf(
  width: number,
  height: number,
  decodeParms?: Record<string, unknown>,
): Promise<Blob> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('makeFlateRgbImagePdf: could not get 2d context');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#8a3324');
  gradient.addColorStop(1, '#283b49');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `hsl(${i % 360} 70% 50%)`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 10, 10);
  }
  const rgba = ctx.getImageData(0, 0, width, height).data;

  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < width * height; i++, j += 4) {
    rgb[i * 3] = rgba[j];
    rgb[i * 3 + 1] = rgba[j + 1];
    rgb[i * 3 + 2] = rgba[j + 2];
  }

  const dict: Record<string, unknown> = {
    Type: 'XObject',
    Subtype: 'Image',
    Width: width,
    Height: height,
    ColorSpace: 'DeviceRGB',
    BitsPerComponent: 8,
    Filter: 'FlateDecode',
  };
  if (decodeParms) dict.DecodeParms = decodeParms;

  const rawStream = doc.context.stream(
    await deflate(rgb),
    dict as Parameters<typeof doc.context.stream>[1],
  );
  const ref = doc.context.register(rawStream);
  page.node.newXObject('Im1', ref);

  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

function applyPredictor2(data: Uint8Array, colors: number, width: number): void {
  const rowBytes = width * colors;
  for (let row = 0; row * rowBytes < data.length; row++) {
    const offset = row * rowBytes;
    for (let i = rowBytes - 1; i >= colors; i--) {
      data[offset + i] = (data[offset + i] - data[offset + i - colors]) & 0xff;
    }
  }
}

async function makePredictor2ImagePdf(width: number, height: number): Promise<Blob> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('makePredictor2ImagePdf: could not get 2d context');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#8a3324');
  gradient.addColorStop(1, '#283b49');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `hsl(${i % 360} 70% 50%)`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 10, 10);
  }
  const rgba = ctx.getImageData(0, 0, width, height).data;

  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < width * height; i++, j += 4) {
    rgb[i * 3] = rgba[j];
    rgb[i * 3 + 1] = rgba[j + 1];
    rgb[i * 3 + 2] = rgba[j + 2];
  }
  applyPredictor2(rgb, 3, width);

  const dict = {
    Type: 'XObject',
    Subtype: 'Image',
    Width: width,
    Height: height,
    ColorSpace: 'DeviceRGB',
    BitsPerComponent: 8,
    Filter: 'FlateDecode',
    DecodeParms: { Predictor: 2, Colors: 3, BitsPerComponent: 8, Columns: width },
  };

  const rawStream = doc.context.stream(
    await deflate(rgb),
    dict as Parameters<typeof doc.context.stream>[1],
  );
  const ref = doc.context.register(rawStream);
  page.node.newXObject('Im1', ref);

  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

async function photoJpeg(width: number, height: number): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('photoJpeg: could not get 2d context');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#8a3324');
  gradient.addColorStop(1, '#283b49');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `hsl(${i % 360} 70% 50%)`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 10, 10);
  }
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 1 });
  return new Uint8Array(await blob.arrayBuffer());
}

async function makePdf(options: { text: boolean; image: boolean }): Promise<Blob> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);

  if (options.image) {
    const image = await doc.embedJpg(await photoJpeg(1800, 1400));
    page.drawImage(image, { x: 0, y: 300, width: 595, height: 450 });
  }
  if (options.text) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText('the quick brown fox', { x: 60, y: 120, size: 24, font });
  }

  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

function fontNamesOf(doc: PDFDocument): string {
  const fonts = doc.getPage(0).node.normalizedEntries().Font;
  return fonts ? fonts.toString() : '';
}

describe('compressPdf', () => {
  it('shrinks a PDF whose weight is embedded images', async () => {
    const input = await makePdf({ text: true, image: true });
    const output = await compressPdf(input, { quality: 0.5 });

    expect(output.size).toBeLessThan(input.size);
  });

  it('keeps text as vector, not pixels', async () => {
    const input = await makePdf({ text: true, image: true });
    const output = await compressPdf(input, { quality: 0.5 });
    const doc = await PDFDocument.load(await output.arrayBuffer());

    expect(doc.getPageCount()).toBe(1);
    expect(fontNamesOf(doc)).toContain('Helvetica');
  });

  it('returns the original when there is nothing to shave', async () => {
    const input = await makePdf({ text: true, image: false });
    const output = await compressPdf(input, { quality: 0.5 });

    expect(output.size).toBeLessThanOrEqual(input.size);
  });

  it('lower quality yields a smaller file', async () => {
    const input = await makePdf({ text: false, image: true });
    const low = await compressPdf(input, { quality: 0.2 });
    const high = await compressPdf(input, { quality: 0.9 });

    expect(low.size).toBeLessThan(high.size);
  });

  it('reports progress up to 100', async () => {
    const seen: number[] = [];
    await compressPdf(await makePdf({ text: true, image: true }), { quality: 0.5 }, (percent) =>
      seen.push(percent),
    );

    expect(seen.at(-1)).toBe(100);
  });

  it('drops unreferenced objects nothing in the page tree points to', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText('the quick brown fox', { x: 60, y: 120, size: 24, font });

    const junk = new Uint8Array(2_000_000).fill(1);
    doc.context.register(doc.context.stream(junk));

    const bytes = await doc.save();
    const input = new Blob([bytes.slice().buffer], { type: 'application/pdf' });

    const output = await compressPdf(input, { quality: 0.5 });
    expect(output.size).toBeLessThan(input.size / 10);

    const reloaded = await PDFDocument.load(await output.arrayBuffer());
    expect(reloaded.getPageCount()).toBe(1);
    expect(fontNamesOf(reloaded)).toContain('Helvetica');
  });

  it('keeps an image only reachable through page resources, not deleted as unreferenced', async () => {
    const input = await makePdf({ text: false, image: true });
    const output = await compressPdf(input, { quality: 0.9 });

    const doc = await PDFDocument.load(await output.arrayBuffer());
    expect(doc.getPage(0).node.normalizedEntries().XObject).toBeDefined();
  });

  it('recompresses a raw FlateDecode DeviceRGB image with no PNG predictor', async () => {
    const input = await makeFlateRgbImagePdf(400, 400);
    const output = await compressPdf(input, { quality: 0.5 });

    expect(output.size).toBeLessThan(input.size / 2);

    const doc = await PDFDocument.load(await output.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
  });

  it('leaves a FlateDecode image alone if it uses a PNG predictor (15), only predictor 2 is supported', async () => {
    const input = await makeFlateRgbImagePdf(50, 50, {
      Predictor: 15,
      Colors: 3,
      BitsPerComponent: 8,
      Columns: 50,
    });

    const output = await compressPdf(input, { quality: 0.5 });
    const doc = await PDFDocument.load(await output.arrayBuffer());

    let found = false;
    for (const [, object] of doc.context.enumerateIndirectObjects()) {
      if (
        object instanceof PDFRawStream &&
        object.dict.get(PDFName.of('Subtype'))?.toString() === '/Image'
      ) {
        found = true;
        expect(object.dict.get(PDFName.of('Filter'))?.toString()).toBe('/FlateDecode');
      }
    }
    expect(found).toBe(true);
  });

  it('recompresses a FlateDecode image using the TIFF horizontal predictor (2)', async () => {
    const input = await makePredictor2ImagePdf(400, 400);
    const output = await compressPdf(input, { quality: 0.5 });

    expect(output.size).toBeLessThan(input.size / 2);

    const doc = await PDFDocument.load(await output.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
  });
});
