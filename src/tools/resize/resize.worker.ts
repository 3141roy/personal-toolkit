import { resize, type ResizeOptions } from '../../lib/image/resize';

export interface ResizeRequest {
  input: Blob;
  opts: ResizeOptions;
}

export type ResizeResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<ResizeRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await resize(input, opts, (percent) => {
      const progress: ResizeResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: ResizeResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resize failed';
    const error: ResizeResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
