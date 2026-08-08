import type { Category } from '../tools/types';

export const siteName = 'Ream';

export const supportEmail = '#TEMPLATE';

export const categories: { id: Category; label: string }[] = [
  { id: 'pdf', label: 'PDF' },
  { id: 'image', label: 'Image' },
  { id: 'dev', label: 'Dev' },
  { id: 'text', label: 'Text' },
  { id: 'generate', label: 'Generate' },
];
