import { existsSync, mkdirSync, createWriteStream, renameSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const MODEL_URL = 'https://huggingface.co/skillsafe-ai/u2netp/resolve/main/u2netp.onnx';
const MODEL_DIR = 'public/models';

mkdirSync(MODEL_DIR, { recursive: true });

const modelPath = `${MODEL_DIR}/u2netp.onnx`;
if (existsSync(modelPath)) {
  console.log('fetch-models: u2netp.onnx already present, skipping download');
} else {
  console.log('fetch-models: downloading u2netp.onnx');
  const response = await fetch(MODEL_URL);
  if (!response.ok || !response.body) {
    throw new Error(`fetch-models: failed to download model (status ${response.status})`);
  }
  const tmpPath = `${modelPath}.tmp`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(tmpPath));
  renameSync(tmpPath, modelPath);
}
