import { sharedCopy } from '../../lib/copy/shared';

export const copy = {
  ...sharedCopy,
  empty: "Drop a PDF here, we'll show what it's carrying.",
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
  noneFound: 'No metadata found. Type a title or author below to add some, or save a clean copy.',
  xmpStale: 'Embedded XMP is kept and still holds the old values. Untick it to clear them.',
  disclaimer:
    "Covers the document info, XMP and app-private data. The pages themselves (text, images, comment authors) aren't touched.",
  button: 'Save & keep it',
  download: 'Grab it',
  error: 'That PDF is being difficult, mind trying another?',
};
