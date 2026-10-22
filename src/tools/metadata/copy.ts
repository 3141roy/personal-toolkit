import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: "Drop a photo here, we'll show what it's carrying.",
  working: 'rewriting it on your machine',
  hint: 'Tick what to keep, edit any text, the rest is cleared.',
  selectAll: 'Select all',
  unselectAll: 'Unselect all',
  keepLabel: 'Keep',
  placeholder: 'empty',
  done: (cleared: number, kept: number, edited: number) => {
    const parts = [];
    if (cleared > 0) parts.push(`${cleared} cleared`);
    if (edited > 0) parts.push(`${edited} edited`);
    if (kept > 0) parts.push(`${kept} kept`);
    return parts.length > 0
      ? `${parts.join(', ')}.`
      : "Nothing to change, but here's a fresh copy.";
  },
  noneFound:
    'No metadata found. Type an artist or copyright below to add some, or save a clean copy.',
  orientationNote: 'Orientation is unticked, so the photo may show sideways in some apps.',
  wholeFile: 'This format is cleared in full. Picking what stays works on JPEG only.',
  disclaimer:
    'Best-effort read of common tags, not an audited spec. JPEG is rewritten without re-encoding, so the picture is untouched.',
  button: 'Save & keep it',
  download: 'Grab it',
};
