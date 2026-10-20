import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'pdf-password',
  name: 'PDF Password',
  category: 'pdf',
  icon: 'lock',
  summary: 'Lock a PDF with a password, change it, or remove one you know.',
  cardSummary: 'Lock, change or remove a PDF password.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
  seo: {
    title: 'Password Protect or Unlock a PDF - Free, No Upload - Bundle',
    description:
      'Add a password to a PDF with AES-256, or remove one you know. Free, runs entirely in your browser, so the file and the password never leave your device.',
  },
  faq: [
    {
      q: 'Does the password get sent anywhere?',
      a: 'No. The password and the file stay in your browser, which is the point. Most sites like this upload both to a server.',
    },
    {
      q: 'How strong is the lock?',
      a: 'AES-256, the strongest scheme PDF supports. Strength still depends on your password, so a long one beats a clever short one.',
    },
    {
      q: 'Can you unlock a PDF I forgot the password to?',
      a: "No. Unlock only works with the correct password, and nothing here guesses or cracks one. A forgotten password can't be recovered.",
    },
    {
      q: 'Can I change a PDF password?',
      a: 'Yes. Drop a locked PDF, pick "Change the password", enter the current one and a new one. The result is re-encrypted with AES-256, even if the old file used something weaker.',
    },
    {
      q: 'Will the locked PDF open everywhere?',
      a: 'In current viewers, yes: Acrobat, Preview, and the major browsers. Very old readers may not handle AES-256.',
    },
  ],
  guide: [
    {
      heading: 'What the lock does',
      body: 'Your password encrypts the whole file with AES-256. Without it the contents are unreadable, not just hidden.',
    },
    {
      heading: 'What it needs first',
      body: 'The first time, your browser downloads the lock engine (about 2 MB) and keeps it. After that the tool works the same, and nothing about your file is ever sent.',
    },
  ],
  related: [
    { id: 'split', anchor: 'Split a PDF' },
    { id: 'merge', anchor: 'Merge PDFs' },
  ],
};

export default manifest;
