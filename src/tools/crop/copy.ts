import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a photo here.',
  working: 'trimming on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  button: 'Crop & keep it',
  download: 'Grab it',
};
