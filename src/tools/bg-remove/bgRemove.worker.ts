import * as ort from 'onnxruntime-web/wasm';
import { loadModel } from '../../lib/model/modelLoader';
import {
  MODEL_SIZE,
  computeLetterbox,
  toModelInput,
  normalizeMask,
  compositeAlpha,
} from './bgRemove';

export interface BgRemoveRequest {
  input: Blob;
}

export type BgRemoveResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

const MODEL_URL = '/models/u2netp.onnx';

ort.env.wasm.numThreads = 1;

function post(message: BgRemoveResponse) {
  self.postMessage(message);
}

function context2d(canvas: OffscreenCanvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('bg-remove: could not get 2d context');
  return ctx;
}

self.onmessage = async (event: MessageEvent<BgRemoveRequest>) => {
  try {
    const { input } = event.data;
    post({ type: 'progress', percent: 10 });

    const bitmap = await createImageBitmap(input);
    const { width, height } = bitmap;
    const { padX, padY, targetW, targetH } = computeLetterbox(width, height);

    const inputCanvas = new OffscreenCanvas(MODEL_SIZE, MODEL_SIZE);
    const inputCtx = context2d(inputCanvas);
    inputCtx.drawImage(bitmap, padX, padY, targetW, targetH);
    const inputPixels = inputCtx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data;

    post({ type: 'progress', percent: 25 });
    const modelBuffer = await loadModel(MODEL_URL);
    post({ type: 'progress', percent: 55 });

    const session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
    });
    const tensor = new ort.Tensor('float32', toModelInput(inputPixels), [
      1,
      3,
      MODEL_SIZE,
      MODEL_SIZE,
    ]);
    const results = await session.run({ [session.inputNames[0]]: tensor });
    const mask = normalizeMask(results[session.outputNames[0]].data as Float32Array);

    post({ type: 'progress', percent: 80 });

    const maskCanvas = new OffscreenCanvas(MODEL_SIZE, MODEL_SIZE);
    const maskCtx = context2d(maskCanvas);
    const maskImageData = maskCtx.createImageData(MODEL_SIZE, MODEL_SIZE);
    for (let i = 0; i < mask.length; i++) {
      const v = Math.round(mask[i] * 255);
      maskImageData.data[i * 4] = v;
      maskImageData.data[i * 4 + 1] = v;
      maskImageData.data[i * 4 + 2] = v;
      maskImageData.data[i * 4 + 3] = 255;
    }
    maskCtx.putImageData(maskImageData, 0, 0);

    const upscaledCanvas = new OffscreenCanvas(width, height);
    const upscaledCtx = context2d(upscaledCanvas);
    upscaledCtx.imageSmoothingEnabled = true;
    upscaledCtx.drawImage(maskCanvas, padX, padY, targetW, targetH, 0, 0, width, height);
    const upscaledMaskPixels = upscaledCtx.getImageData(0, 0, width, height).data;
    const upscaledMask = new Float32Array(width * height);
    for (let i = 0; i < upscaledMask.length; i++) {
      upscaledMask[i] = upscaledMaskPixels[i * 4] / 255;
    }

    const outputCanvas = new OffscreenCanvas(width, height);
    const outputCtx = context2d(outputCanvas);
    outputCtx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const originalPixels = outputCtx.getImageData(0, 0, width, height);
    const composited = compositeAlpha(originalPixels.data, upscaledMask);
    outputCtx.putImageData(new ImageData(new Uint8ClampedArray(composited), width, height), 0, 0);

    const result = await outputCanvas.convertToBlob({ type: 'image/png' });
    post({ type: 'progress', percent: 100 });
    post({ type: 'done', result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Background removal failed';
    post({ type: 'error', message });
  }
};
