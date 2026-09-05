import { PDFDict, PDFName, type PDFRawStream } from 'pdf-lib';

const SUBTYPE = PDFName.of('Subtype');
const IMAGE = PDFName.of('Image');
const FILTER = PDFName.of('Filter');
const WIDTH = PDFName.of('Width');
const HEIGHT = PDFName.of('Height');
const COLOR_SPACE = PDFName.of('ColorSpace');
const BITS = PDFName.of('BitsPerComponent');
const DECODE_PARMS = PDFName.of('DecodeParms');
const PREDICTOR = PDFName.of('Predictor');

export function isJpegImage(stream: PDFRawStream): boolean {
  if (stream.dict.get(SUBTYPE) !== IMAGE) return false;
  const filter = stream.dict.get(FILTER);
  return filter !== undefined && filter.toString().includes('DCTDecode');
}

export interface RawBitmapInfo {
  width: number;
  height: number;
  colors: number;
  predictor: number;
}

export function rawBitmapInfo(stream: PDFRawStream): RawBitmapInfo | null {
  if (stream.dict.get(SUBTYPE) !== IMAGE) return null;
  if (stream.dict.get(FILTER)?.toString() !== '/FlateDecode') return null;
  if (stream.dict.get(BITS)?.toString() !== '8') return null;

  const colorSpace = stream.dict.get(COLOR_SPACE)?.toString();
  const colors = colorSpace === '/DeviceRGB' ? 3 : colorSpace === '/DeviceGray' ? 1 : null;
  if (colors === null) return null;

  const parms = stream.dict.get(DECODE_PARMS);
  let predictor = 0;
  if (parms !== undefined) {
    if (!(parms instanceof PDFDict)) return null;
    if (parms.get(PREDICTOR)?.toString() !== '2') return null;
    predictor = 2;
  }

  const width = Number(stream.dict.get(WIDTH)?.toString());
  const height = Number(stream.dict.get(HEIGHT)?.toString());
  if (!width || !height) return null;
  return { width, height, colors, predictor };
}

function undoHorizontalDelta(
  data: Uint8Array,
  colors: number,
  width: number,
  height: number,
): void {
  const rowBytes = width * colors;
  for (let row = 0; row < height; row++) {
    const offset = row * rowBytes;
    for (let i = colors; i < rowBytes; i++) {
      data[offset + i] = (data[offset + i] + data[offset + i - colors]) & 0xff;
    }
  }
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes.slice().buffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function decodeToBitmap(stream: PDFRawStream): Promise<ImageBitmap | null> {
  if (isJpegImage(stream)) {
    try {
      return await createImageBitmap(
        new Blob([stream.contents.slice().buffer], { type: 'image/jpeg' }),
      );
    } catch {
      return null;
    }
  }

  const info = rawBitmapInfo(stream);
  if (!info) return null;

  const { width, height, colors, predictor } = info;
  const data = await inflate(stream.contents);
  if (data.length < width * height * colors) return null;

  if (predictor === 2) undoHorizontalDelta(data, colors, width, height);

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += colors) {
    const value = data[j];
    rgba[i * 4] = colors === 1 ? value : data[j];
    rgba[i * 4 + 1] = colors === 1 ? value : data[j + 1];
    rgba[i * 4 + 2] = colors === 1 ? value : data[j + 2];
    rgba[i * 4 + 3] = 255;
  }

  try {
    return await createImageBitmap(new ImageData(rgba, width, height));
  } catch {
    return null;
  }
}
