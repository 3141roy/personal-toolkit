import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a PDF here.',
  working: 'rendering pages on your machine',
  done: (count: number) => `${count} page${count === 1 ? '' : 's'} exported`,
  button: 'Export pages',
  downloadAll: 'Download all',
  download: 'Download',
};
