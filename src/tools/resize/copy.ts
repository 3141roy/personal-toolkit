import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: "Drop a photo here... It's not going anywhere. literally.",
  working: 'crunching pixels on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  button: 'Resize & keep it',
  download: 'Grab it',
};
