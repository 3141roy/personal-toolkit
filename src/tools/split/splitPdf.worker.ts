import { splitPdf, type SplitRange } from './splitPdf';

export interface SplitRequest {
  input: Blob;
  ranges: SplitRange[];
}

export type SplitResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob[] }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<SplitRequest>) => {
  const { input, ranges } = event.data;

  try {
    const result = await splitPdf(input, ranges, (percent) => {
      const progress: SplitResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: SplitResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Split failed';
    const error: SplitResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
