import { existsSync, mkdirSync, copyFileSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const MODEL_URL = 'https://huggingface.co/skillsafe-ai/u2netp/resolve/main/u2netp.onnx';
const MODEL_DIR = 'public/models';
const ORT_DIR = 'public/models/ort';
const ORT_DIST = 'node_modules/onnxruntime-web/dist';
const ORT_FILES = ['ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs'];

mkdirSync(MODEL_DIR, { recursive: true });
mkdirSync(ORT_DIR, { recursive: true });

for (const file of ORT_FILES) {
  copyFileSync(`${ORT_DIST}/${file}`, `${ORT_DIR}/${file}`);
}

const modelPath = `${MODEL_DIR}/u2netp.onnx`;
if (existsSync(modelPath)) {
  console.log('fetch-models: u2netp.onnx already present, skipping download');
} else {
  console.log('fetch-models: downloading u2netp.onnx');
  const response = await fetch(MODEL_URL);
  if (!response.ok || !response.body) {
    throw new Error(`fetch-models: failed to download model (status ${response.status})`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(modelPath));
}
