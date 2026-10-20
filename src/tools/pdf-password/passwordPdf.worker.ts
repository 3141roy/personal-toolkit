import wasmUrl from 'pdfstudio/qpdf.wasm?url';
import { applyPassword, PasswordToolError, type PasswordMode } from './passwordPdf';

export interface PasswordRequest {
  input: Blob;
  opts: { mode: PasswordMode; password: string; newPassword?: string };
}

export type PasswordResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: Blob }
  | { type: 'error'; message: string };

self.onmessage = async (event: MessageEvent<PasswordRequest>) => {
  const { input, opts } = event.data;

  try {
    const result = await applyPassword(input, { ...opts, wasmUrl }, (percent) => {
      const progress: PasswordResponse = { type: 'progress', percent };
      self.postMessage(progress);
    });

    const done: PasswordResponse = { type: 'done', result };
    self.postMessage(done);
  } catch (err) {
    const message =
      err instanceof PasswordToolError
        ? err.code
        : err instanceof Error
          ? err.message
          : 'Password change failed';
    const error: PasswordResponse = { type: 'error', message };
    self.postMessage(error);
  }
};
