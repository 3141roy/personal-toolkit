import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop a PDF here.',
  working: 'squeezing images on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  button: 'Compress & keep it',
  download: 'Grab it',
  error: "That PDF's being difficult, mind trying another?",
  scopeHint: 'Only the images shrink. Text, links and forms stay as they were.',
  unchanged: 'Already lean, nothing worth shaving. Original returned.',
};
