import { convert, type ConvertOptions } from '../../lib/image/convert';

export interface ConvertRequest {
  input: Blob;
  opts: ConvertOptions;
}

export type ConvertResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<ConvertRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await convert(input, opts, (percent) => {
      const progress: ConvertResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: ConvertResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Convert failed';
    const error: ConvertResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
