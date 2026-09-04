import { imagesToPdf } from './imagesToPdf';

export interface ImagesToPdfRequest {
  inputs: Blob[];
}

export type ImagesToPdfResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<ImagesToPdfRequest>) => {
  const { inputs } = event.data;

  try {
    const result = await imagesToPdf(inputs, (percent) => {
      const progress: ImagesToPdfResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: ImagesToPdfResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Conversion failed';
    const error: ImagesToPdfResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
