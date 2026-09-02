import type { Category } from '../tools/types';

export const siteName = 'Bundle';

export const siteUrl = 'https://bundle.tools';

export const siteDescription =
  'Free, open source PDF and image tools that run entirely in your browser. Nothing is uploaded, nothing leaves your device.';

export const supportEmail = 'help@bundle.tools';

export const reportEmail = 'report@bundle.tools';

export const categories: { id: Category; label: string }[] = [
  { id: 'pdf', label: 'PDF' },
  { id: 'image', label: 'Image' },
  { id: 'dev', label: 'Dev' },
  { id: 'text', label: 'Text' },
  { id: 'generate', label: 'Generate' },
];

export const sharedFaq: { q: string; a: string }[] = [
  {
    q: 'Does this upload my files anywhere?',
    a: "No. Everything runs in your browser. Files never leave your device, there's no server to send them to, and no account or log.",
  },
];
