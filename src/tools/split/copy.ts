import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a PDF here.',
  everyPageLabel: 'Every page, one file each',
  rangesLabel: 'Custom ranges',
  rangesPlaceholder: 'e.g. 1-3, 5, 8-10',
  rangesHint: 'pages are 1-indexed, comma-separated',
  working: 'slicing pages apart on your machine',
  done: (count: number) => `${count} file${count !== 1 ? 's' : ''} ready`,
  button: 'Split & keep it',
  download: 'Grab it',
  downloadAll: 'Grab all',
  error: "That PDF's being difficult, mind trying another?",
  badRange: (detail: string) => `Couldn't read that (${detail}). Try something like "1-3, 5".`,
};
