import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'text-diff',
  name: 'Text diff',
  category: 'text',
  icon: 'git-compare',
  summary: 'Compare two blocks of text, line by line and word by word.',
  accepts: ['text/plain'],
  produces: ['text/plain'],
  faq: [
    {
      q: 'How does it decide what counts as changed?',
      a: "It lines up the two texts to find the longest stretch that's actually unchanged, the same approach git and most code editors use, so a block moved further down still reads as one clean addition instead of a wall of noise.",
    },
    {
      q: 'Does it show what changed inside a line, not just the whole line?',
      a: 'Yes, when a line is edited rather than added or removed outright, the specific words that differ are highlighted within it, so a single changed word or punctuation mark stands out.',
    },
    {
      q: 'Can it ignore whitespace or capitalization differences?',
      a: 'Yes, both are toggles above the result. Ignore whitespace treats lines that only differ in leading or trailing spaces as the same, ignore case does the same for capitalization.',
    },
  ],
};

export default manifest;
