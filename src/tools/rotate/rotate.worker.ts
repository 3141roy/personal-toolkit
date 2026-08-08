import { rotate, type RotateOptions } from './rotate';

export interface RotateRequest {
  input: Blob;
  opts: RotateOptions;
}

export type RotateResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<RotateRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await rotate(input, opts, (percent) => {
      const progress: RotateResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: RotateResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rotate failed';
    const error: RotateResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
