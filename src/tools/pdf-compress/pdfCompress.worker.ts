import { compressPdf, type PdfCompressOptions } from './pdfCompress';

export interface PdfCompressRequest {
  input: Blob;
  opts: PdfCompressOptions;
}

export type PdfCompressResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<PdfCompressRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await compressPdf(input, opts, (percent) => {
      const progress: PdfCompressResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: PdfCompressResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Compress failed';
    const error: PdfCompressResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
