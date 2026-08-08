import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: 'Drop photos here',
  working: (done: number, total: number) => `working on your machine -> ${done} of ${total}`,
  done: (count: number) => `${count} file${count !== 1 ? 's' : ''} done`,
  error: 'One of those files was difficult, mind trying again?',
  button: 'Process all',
  downloadAll: 'Grab all',
  download: 'Grab',
};
