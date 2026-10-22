import { stripPdfMetadata } from './pdfMetadata';

export interface PdfMetadataRequest {
  input: Blob;
  keep: string[];
  edits: Record<string, string>;
}

export type PdfMetadataResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<PdfMetadataRequest>) => {
  const { input, keep, edits } = event.data;

  try {
    const result = await stripPdfMetadata(input, { keep, edits }, (percent) => {
      const progress: PdfMetadataResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: PdfMetadataResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clearing metadata failed';
    const error: PdfMetadataResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
