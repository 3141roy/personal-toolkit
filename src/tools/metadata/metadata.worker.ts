import { clearMetadata, type ClearMetadataOptions } from './metadata';

export interface MetadataRequest {
  input: Blob;
  opts: ClearMetadataOptions;
}

export type MetadataResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<MetadataRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await clearMetadata(input, opts, (percent) => {
      const progress: MetadataResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: MetadataResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clearing metadata failed';
    const error: MetadataResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
