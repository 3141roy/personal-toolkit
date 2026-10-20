import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { createPdfToolkit } from 'pdfstudio';
import { looksEncrypted } from '../../lib/pdf/looksEncrypted';
import { applyPassword, PasswordToolError } from './passwordPdf';

async function makePdf(pages: number): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200 + i, 300]);
  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}

async function code(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
  } catch (err) {
    return err instanceof PasswordToolError ? err.code : String(err);
  }
  return undefined;
}

describe('applyPassword', () => {
  it('opens in a second, independent reader (pdf.js) only with the password', async () => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const locked = await applyPassword(await makePdf(2), { mode: 'lock', password: 'hunter2' });
    const data = await locked.arrayBuffer();

    const open = (password?: string) =>
      pdfjs.getDocument({ data: new Uint8Array(data.slice(0)), password }).promise;

    await expect(open()).rejects.toMatchObject({ name: 'PasswordException' });
    await expect(open('wrong')).rejects.toMatchObject({ name: 'PasswordException' });
    expect((await open('hunter2')).numPages).toBe(2);
  });

  it('locks a PDF so it cannot be opened without the password', async () => {
    const locked = await applyPassword(await makePdf(3), { mode: 'lock', password: 'hunter2' });

    await expect(PDFDocument.load(await locked.arrayBuffer())).rejects.toThrow();
  });

  it('locks with AES-256', async () => {
    const locked = await applyPassword(await makePdf(1), { mode: 'lock', password: 'hunter2' });
    const toolkit = await createPdfToolkit();
    const info = await toolkit.getInfo(new Uint8Array(await locked.arrayBuffer()), {
      password: 'hunter2',
    });

    expect(info.encrypted).toBe(true);
    expect(info.encryption?.bits).toBe(256);
    expect(info.encryption?.method).toBe('AESv3');
  });

  it('unlocks with the right password and keeps every page', async () => {
    const original = await makePdf(3);
    const locked = await applyPassword(original, { mode: 'lock', password: 'hunter2' });
    const unlocked = await applyPassword(locked, { mode: 'unlock', password: 'hunter2' });
    const reopened = await PDFDocument.load(await unlocked.arrayBuffer());

    expect(reopened.getPageCount()).toBe(3);
    expect(reopened.getPage(2).getSize().width).toBe(202);
  });

  it('rejects the wrong password', async () => {
    const locked = await applyPassword(await makePdf(1), { mode: 'lock', password: 'hunter2' });

    expect(await code(applyPassword(locked, { mode: 'unlock', password: 'nope' }))).toBe(
      'wrong-password',
    );
  });

  it('refuses to lock a PDF that is already locked', async () => {
    const locked = await applyPassword(await makePdf(1), { mode: 'lock', password: 'hunter2' });

    expect(await code(applyPassword(locked, { mode: 'lock', password: 'other' }))).toBe(
      'already-locked',
    );
  });

  it('refuses to unlock a PDF that is not locked', async () => {
    expect(
      await code(applyPassword(await makePdf(1), { mode: 'unlock', password: 'hunter2' })),
    ).toBe('not-locked');
  });

  it('handles passwords with spaces and non-ASCII characters', async () => {
    const password = 'pässwörd 密码 🔐';
    const locked = await applyPassword(await makePdf(2), { mode: 'lock', password });
    const unlocked = await applyPassword(locked, { mode: 'unlock', password });

    expect((await PDFDocument.load(await unlocked.arrayBuffer())).getPageCount()).toBe(2);
  });

  it('rejects an empty password', async () => {
    await expect(applyPassword(await makePdf(1), { mode: 'lock', password: '' })).rejects.toThrow();
  });
});

describe('changing a password', () => {
  it('swaps the password: old stops working, new works', async () => {
    const original = await makePdf(3);
    const locked = await applyPassword(original, { mode: 'lock', password: 'old-pass' });
    const changed = await applyPassword(locked, {
      mode: 'change',
      password: 'old-pass',
      newPassword: 'new-pass',
    });

    expect(await code(applyPassword(changed, { mode: 'unlock', password: 'old-pass' }))).toBe(
      'wrong-password',
    );
    const opened = await applyPassword(changed, { mode: 'unlock', password: 'new-pass' });
    expect((await PDFDocument.load(await opened.arrayBuffer())).getPageCount()).toBe(3);
  });

  it('rejects the wrong current password', async () => {
    const locked = await applyPassword(await makePdf(1), { mode: 'lock', password: 'old-pass' });

    expect(
      await code(
        applyPassword(locked, { mode: 'change', password: 'nope', newPassword: 'new-pass' }),
      ),
    ).toBe('wrong-password');
  });

  it('refuses to change the password of an unlocked PDF', async () => {
    expect(
      await code(
        applyPassword(await makePdf(1), { mode: 'change', password: 'a', newPassword: 'b' }),
      ),
    ).toBe('not-locked');
  });

  it('upgrades an AES-128 file to AES-256', async () => {
    const toolkit = await createPdfToolkit();
    const weak = await toolkit.lock(new Uint8Array(await (await makePdf(1)).arrayBuffer()), {
      userPassword: 'old-pass',
      keyLength: 128,
    });
    const changed = await applyPassword(new Blob([weak.slice().buffer]), {
      mode: 'change',
      password: 'old-pass',
      newPassword: 'new-pass',
    });
    const info = await toolkit.getInfo(new Uint8Array(await changed.arrayBuffer()), {
      password: 'new-pass',
    });

    expect(info.encryption?.bits).toBe(256);
  });

  it('rejects an empty new password', async () => {
    const locked = await applyPassword(await makePdf(1), { mode: 'lock', password: 'old-pass' });

    await expect(
      applyPassword(locked, { mode: 'change', password: 'old-pass', newPassword: '' }),
    ).rejects.toThrow();
  });
});

describe('looksEncrypted', () => {
  const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

  it('is false for a plain PDF', async () => {
    expect(looksEncrypted(await bytesOf(await makePdf(2)))).toBe(false);
  });

  it('is true for a locked PDF, at every key length', async () => {
    const toolkit = await createPdfToolkit();
    const plain = await bytesOf(await makePdf(2));

    for (const keyLength of [40, 128, 256] as const) {
      const locked = await toolkit.lock(plain, { userPassword: 'x', keyLength });
      expect(looksEncrypted(locked)).toBe(true);
    }
  });

  it('is true after changing the password', async () => {
    const locked = await applyPassword(await makePdf(1), { mode: 'lock', password: 'a' });
    const changed = await applyPassword(locked, {
      mode: 'change',
      password: 'a',
      newPassword: 'b',
    });

    expect(looksEncrypted(await bytesOf(changed))).toBe(true);
  });

  it('is false after removing the password', async () => {
    const locked = await applyPassword(await makePdf(1), { mode: 'lock', password: 'a' });
    const unlocked = await applyPassword(locked, { mode: 'unlock', password: 'a' });

    expect(looksEncrypted(await bytesOf(unlocked))).toBe(false);
  });

  it('is not fooled by the word in text or by EncryptMetadata', () => {
    const text = new TextEncoder().encode(
      '%PDF-1.7\n(see /Encrypt for details) /EncryptMetadata true',
    );

    expect(looksEncrypted(text)).toBe(false);
  });

  it('is true for a trailer that points at an Encrypt dictionary', () => {
    const trailer = new TextEncoder().encode('trailer << /Size 9 /Encrypt 8 0 R /Root 1 0 R >>');

    expect(looksEncrypted(trailer)).toBe(true);
  });
});
