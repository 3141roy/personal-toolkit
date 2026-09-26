export const MODEL_SIZE = 320;

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export interface Letterbox {
  scale: number;
  padX: number;
  padY: number;
  targetW: number;
  targetH: number;
}

export function computeLetterbox(srcWidth: number, srcHeight: number): Letterbox {
  const scale = Math.min(MODEL_SIZE / srcWidth, MODEL_SIZE / srcHeight);
  const targetW = Math.round(srcWidth * scale);
  const targetH = Math.round(srcHeight * scale);
  const padX = Math.floor((MODEL_SIZE - targetW) / 2);
  const padY = Math.floor((MODEL_SIZE - targetH) / 2);
  return { scale, padX, padY, targetW, targetH };
}

export function toModelInput(rgba: Uint8ClampedArray): Float32Array {
  const pixelCount = MODEL_SIZE * MODEL_SIZE;
  const data = new Float32Array(pixelCount * 3);
  for (let i = 0; i < pixelCount; i++) {
    const r = rgba[i * 4] / 255;
    const g = rgba[i * 4 + 1] / 255;
    const b = rgba[i * 4 + 2] / 255;
    data[i] = (r - MEAN[0]) / STD[0];
    data[pixelCount + i] = (g - MEAN[1]) / STD[1];
    data[pixelCount * 2 + i] = (b - MEAN[2]) / STD[2];
  }
  return data;
}

export function normalizeMask(mask: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (const v of mask) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const out = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i++) out[i] = (mask[i] - min) / range;
  return out;
}

export function compositeAlpha(rgba: Uint8ClampedArray, mask: Float32Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < mask.length; i++) {
    const base = i * 4;
    out[base] = rgba[base];
    out[base + 1] = rgba[base + 1];
    out[base + 2] = rgba[base + 2];
    out[base + 3] = Math.round(rgba[base + 3] * mask[i]);
  }
  return out;
}
