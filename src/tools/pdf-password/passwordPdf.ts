import { createPdfToolkit, PdfPasswordError, type PdfToolkit } from 'pdfstudio';

export type PasswordMode = 'lock' | 'unlock' | 'change';
export type PasswordErrorCode = 'wrong-password' | 'already-locked' | 'not-locked';

export interface PasswordOptions {
  mode: PasswordMode;
  password: string;
  newPassword?: string;
  wasmUrl?: string;
}

export type PasswordProgress = (percent: number) => void;

export class PasswordToolError extends Error {
  code: PasswordErrorCode;

  constructor(code: PasswordErrorCode) {
    super(code);
    this.name = 'PasswordToolError';
    this.code = code;
  }
}

export async function applyPassword(
  input: Blob,
  opts: PasswordOptions,
  onProgress?: PasswordProgress,
): Promise<Blob> {
  if (!opts.password) {
    throw new Error('applyPassword: password is empty');
  }
  if (opts.mode === 'change' && !opts.newPassword) {
    throw new Error('applyPassword: new password is empty');
  }

  onProgress?.(10);
  const toolkit: PdfToolkit = await createPdfToolkit(opts.wasmUrl ? { wasmUrl: opts.wasmUrl } : {});
  const bytes = new Uint8Array(await input.arrayBuffer());
  const encrypted = await toolkit.isEncrypted(bytes);
  onProgress?.(40);

  let output: Uint8Array;
  if (opts.mode === 'lock') {
    if (encrypted) throw new PasswordToolError('already-locked');
    output = await toolkit.lock(bytes, { userPassword: opts.password, keyLength: 256 });
  } else {
    if (!encrypted) throw new PasswordToolError('not-locked');
    try {
      output =
        opts.mode === 'unlock'
          ? await toolkit.unlock(bytes, { password: opts.password })
          : await toolkit.changePassword(bytes, {
              currentPassword: opts.password,
              newPassword: opts.newPassword as string,
              keyLength: 256,
            });
    } catch (err) {
      if (err instanceof PdfPasswordError) throw new PasswordToolError('wrong-password');
      throw err;
    }
  }

  onProgress?.(100);
  return new Blob([output.slice().buffer], { type: 'application/pdf' });
}
