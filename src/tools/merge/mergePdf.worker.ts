import { mergePdfs } from './mergePdf';

export interface MergeRequest {
  inputs: Blob[];
}

export type MergeResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<MergeRequest>) => {
  const { inputs } = event.data;

  try {
    const result = await mergePdfs(inputs, (percent) => {
      const progress: MergeResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: MergeResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Merge failed';
    const error: MergeResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
