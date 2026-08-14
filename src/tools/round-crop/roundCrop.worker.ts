import { roundCrop, type RoundCropOptions } from './roundCrop';

export interface RoundCropRequest {
  input: Blob;
  opts: RoundCropOptions;
}

export type RoundCropResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<RoundCropRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await roundCrop(input, opts, (percent) => {
      const progress: RoundCropResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: RoundCropResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rounded crop failed';
    const error: RoundCropResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
