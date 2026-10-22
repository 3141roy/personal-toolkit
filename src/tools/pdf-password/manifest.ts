import type { ToolManifest } from '../types';

const lockDoes = {
  heading: 'What the lock does',
  body: 'Your password encrypts the whole file with AES-256. Without it the contents are unreadable, not just hidden.',
};

const needsFirst = {
  heading: 'What it needs first',
  body: 'The first time, your browser downloads the lock engine (about 2 MB) and keeps it. After that the tool works the same, and nothing about your file is ever sent.',
};

const runsOn = {
  heading: 'What it runs on',
  body: "The lock engine is pdfstudio, which packages qpdf as WebAssembly. We're working on our own PDF library so this leans less on third-party code.",
  link: { text: 'pdfstudio on GitHub', href: 'https://github.com/fayazara/pdfstudio' },
};

const manifest: ToolManifest = {
  id: 'pdf-password',
  name: 'PDF Password',
  h1: 'Lock, change or remove a PDF password',
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
  guide: [lockDoes, needsFirst, runsOn],
  variants: [
    {
      slug: 'protect-pdf',
      h1: 'Password protect a PDF',
      title: 'Password Protect a PDF - Free, No Upload - Bundle',
      description:
        'Add a password to a PDF with AES-256. Free, runs entirely in your browser, so the file and the password never leave your device.',
      guide: [
        {
          heading: 'What happens to your file',
          body: "Your password encrypts the whole file with AES-256, so without it the contents can't be read. We never see the password, which also means we can't recover it for you.",
        },
        needsFirst,
        runsOn,
      ],
      faq: [
        {
          q: 'How do I password protect a PDF without uploading it?',
          a: 'Drop it here, set a password, and download the locked copy. The encryption happens in your browser, so neither the file nor the password is sent anywhere.',
        },
        {
          q: 'Can I change the password later?',
          a: 'Yes. Drop the locked file into PDF Password, pick "Change the password", and enter the old one and a new one.',
        },
      ],
      props: {
        preset: 'lock',
        fallback: { href: '/pdf/pdf-password/', label: 'PDF Password' },
      },
    },
    {
      slug: 'unlock-pdf',
      h1: 'Unlock a PDF',
      title: 'Unlock a PDF - Remove the Password - Free, No Upload - Bundle',
      description:
        'Remove the password from a PDF you can open. Free, runs entirely in your browser, so the file and the password never leave your device.',
      guide: [
        {
          heading: 'What happens to your file',
          body: "This removes a password you already know. It doesn't guess or crack anything. The unlocked copy has no protection at all, so keep it private.",
        },
        needsFirst,
        runsOn,
      ],
      faq: [
        {
          q: 'Can I unlock a PDF if I forgot the password?',
          a: "No. This only removes a password you can enter. It doesn't guess or crack anything, and a forgotten password can't be recovered.",
        },
        {
          q: 'Is the unlocked copy still protected?',
          a: 'No. The copy has no password or restrictions, so anyone with the file can open it.',
        },
      ],
      props: {
        preset: 'unlock',
        fallback: { href: '/pdf/pdf-password/', label: 'PDF Password' },
      },
    },
  ],
  related: [
    { id: 'split', anchor: 'Split a PDF' },
    { id: 'merge', anchor: 'Merge PDFs' },
  ],
};

export default manifest;
