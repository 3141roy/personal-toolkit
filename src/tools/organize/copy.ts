import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a PDF here, add more to pull pages in from them too.',
  reorderHint: 'drag a page to reorder, or use the arrows, first one goes first',
  minHint: 'keep at least 1 page',
  working: 'rebuilding the PDF on your machine',
  done: (count: number, size: string) =>
    `${count} page${count !== 1 ? 's' : ''} -> one file, ${size}`,
  button: 'Save & keep it',
  download: 'Grab it',
  error: 'One of those PDFs is being difficult, mind trying another?',
};
