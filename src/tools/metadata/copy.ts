import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: "Drop a photo here, we'll show you what it's carrying.",
  working: 'stripping it out on your machine',
  done: (count: number) =>
    count > 0
      ? `Found ${count} thing${count === 1 ? '' : 's'} in there. Gone now.`
      : "Nothing was in there, but here's a fresh copy anyway.",
  noneFound: 'No metadata found, this photo came clean.',
  disclaimer:
    'Best-effort read of common tags, not an audited spec. Clearing wipes everything regardless of what we recognized.',
  button: 'Clear & keep it',
};
