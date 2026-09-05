import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop JPEGs or PNGs here, add as many as you like.',
  reorderHint: 'reorder with the arrows, first one goes first',
  working: 'building your PDF on your machine',
  done: (count: number, size: string) =>
    `${count} image${count === 1 ? '' : 's'} -> one PDF, ${size}`,
  button: 'Build PDF',
  download: 'Grab it',
};
