import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a photo here.',
  working: 'crunching pixels on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  button: 'Compress & keep it',
  download: 'Grab it',
};
