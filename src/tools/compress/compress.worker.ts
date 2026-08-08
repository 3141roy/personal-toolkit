import { compress, type CompressOptions } from '../../lib/image/compress';

export interface CompressRequest {
  input: Blob;
  opts: CompressOptions;
}

export type CompressResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<CompressRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await compress(input, opts, (percent) => {
      const progress: CompressResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: CompressResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Compress failed';
    const error: CompressResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
