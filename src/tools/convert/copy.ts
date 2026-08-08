import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a photo here.',
  working: 'converting on your machine',
  done: (format: string) => `converted to ${format}`,
  button: 'Convert & keep it',
  download: 'Grab it',
};
