import { processOne, type BulkOperation } from './bulk';

export interface BulkFile {
  id: string;
  input: Blob;
}

export interface BulkRequest {
  files: BulkFile[];
  operation: BulkOperation;
}

export type BulkResponse =
  | { type: 'file-progress'; id: string; percent: number }
  | { type: 'file-done'; id: string; result: Blob }
  | { type: 'file-error'; id: string; message: string }
  | { type: 'all-done' };

self.onmessage = async (event: MessageEvent<BulkRequest>) => {
  const { files, operation } = event.data;

  for (const file of files) {
    try {
      const result = await processOne(file.input, operation, (percent) => {
        const progress: BulkResponse = { type: 'file-progress', id: file.id, percent };
        self.postMessage(progress);
      });

      const done: BulkResponse = { type: 'file-done', id: file.id, result };
      self.postMessage(done);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      const error: BulkResponse = { type: 'file-error', id: file.id, message };
      self.postMessage(error);
    }
  }

  const allDone: BulkResponse = { type: 'all-done' };
  self.postMessage(allDone);
};
