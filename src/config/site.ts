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
