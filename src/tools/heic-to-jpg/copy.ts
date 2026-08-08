import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop an iPhone photo here.',
  working: 'unpacking it on your machine',
  done: (before: string, after: string) => `${before} -> ${after}`,
  error: "That HEIC file's being difficult, mind trying another?",
  button: 'Convert to JPG',
  download: 'Grab it',
};
