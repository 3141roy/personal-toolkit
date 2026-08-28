import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop PDFs here, add as many as you like.',
  reorderHint: 'reorder with the arrows, first one goes first',
  minHint: 'add at least 2 to merge',
  working: 'stitching pages together on your machine',
  done: (count: number, size: string) => `${count} PDFs -> one file, ${size}`,
  button: 'Merge & keep it',
  download: 'Grab it',
  error: 'One of those PDFs is being difficult, mind trying another?',
};
