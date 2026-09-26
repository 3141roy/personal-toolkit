import { describe, it, expect } from 'vitest';
import { computeLetterbox, toModelInput, normalizeMask, compositeAlpha, MODEL_SIZE } from './bgRemove';

describe('computeLetterbox', () => {
  it('needs no padding for an already-square image at model size', () => {
    expect(computeLetterbox(320, 320)).toEqual({ scale: 1, padX: 0, padY: 0, targetW: 320, targetH: 320 });
  });

  it('pads a wide image on the vertical axis', () => {
    const box = computeLetterbox(200, 100);
    expect(box.targetW).toBe(320);
    expect(box.targetH).toBe(160);
    expect(box.padX).toBe(0);
    expect(box.padY).toBe(80);
  });

  it('pads a tall image on the horizontal axis', () => {
    const box = computeLetterbox(100, 200);
    expect(box.targetW).toBe(160);
    expect(box.targetH).toBe(320);
    expect(box.padY).toBe(0);
    expect(box.padX).toBe(80);
  });

  it('upscales an image smaller than the model input without negative padding', () => {
    const box = computeLetterbox(50, 50);
    expect(box.targetW).toBe(320);
    expect(box.targetH).toBe(320);
    expect(box.padX).toBe(0);
    expect(box.padY).toBe(0);
  });
});

describe('toModelInput', () => {
  it('normalizes a pixel into NCHW layout', () => {
    const rgba = new Uint8ClampedArray(MODEL_SIZE * MODEL_SIZE * 4);
    rgba[0] = 255;
    rgba[1] = 0;
    rgba[2] = 0;
    rgba[3] = 255;
    const data = toModelInput(rgba);
    const pixelCount = MODEL_SIZE * MODEL_SIZE;
    expect(data[0]).toBeCloseTo((1 - 0.485) / 0.229);
    expect(data[pixelCount]).toBeCloseTo((0 - 0.456) / 0.224);
    expect(data[pixelCount * 2]).toBeCloseTo((0 - 0.406) / 0.225);
  });
});

describe('normalizeMask', () => {
  it('stretches values to fill 0..1', () => {
    const mask = new Float32Array([0.2, 0.4, 0.6]);
    const result = Array.from(normalizeMask(mask));
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0.5);
    expect(result[2]).toBeCloseTo(1);
  });

  it('does not divide by zero on a flat mask', () => {
    const mask = new Float32Array([0.5, 0.5]);
    const result = Array.from(normalizeMask(mask));
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
  });
});

describe('compositeAlpha', () => {
  it('keeps an opaque pixel fully visible under a mask of 1', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 255]);
    expect(Array.from(compositeAlpha(rgba, new Float32Array([1])))).toEqual([10, 20, 30, 255]);
  });

  it('makes a pixel fully transparent under a mask of 0', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 255]);
    expect(Array.from(compositeAlpha(rgba, new Float32Array([0])))).toEqual([10, 20, 30, 0]);
  });

  it('multiplies the mask into existing partial transparency instead of overwriting it', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 128]);
    expect(Array.from(compositeAlpha(rgba, new Float32Array([0.5])))).toEqual([10, 20, 30, 64]);
  });
});
