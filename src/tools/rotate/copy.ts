import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a photo here.',
  working: 'turning it on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  button: 'Rotate & keep it',
  download: 'Grab it',
};
