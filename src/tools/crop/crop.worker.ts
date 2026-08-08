import { crop, type CropOptions } from './crop';

export interface CropRequest {
  input: Blob;
  opts: CropOptions;
}

export type CropResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<CropRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await crop(input, opts, (percent) => {
      const progress: CropResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: CropResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Crop failed';
    const error: CropResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
