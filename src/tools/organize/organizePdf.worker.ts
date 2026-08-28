import { organizePdf, type PageRef } from './organizePdf';

export interface OrganizeRequest {
  inputs: Blob[];
  pages: PageRef[];
}

export type OrganizeResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<OrganizeRequest>) => {
  const { inputs, pages } = event.data;

  try {
    const result = await organizePdf(inputs, pages, (percent) => {
      const progress: OrganizeResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: OrganizeResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Organize failed';
    const error: OrganizeResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
