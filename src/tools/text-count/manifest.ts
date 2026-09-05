import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'text-count',
  name: 'Word counter',
  category: 'text',
  icon: 'text-size',
  summary: 'Count words, characters, and lines as you type.',
  accepts: ['text/plain'],
  produces: ['text/plain'],
  faq: [
    {
      q: 'How does it count words?',
      a: 'It splits on whitespace, so "well-known" and "don\'t" each count as one word, and multiple spaces between words never inflate the count.',
    },
    {
      q: 'Does the character count include spaces?',
      a: "The main count does. A separate 'without spaces' count is shown alongside it if you need that instead.",
    },
  ],
};

export default manifest;
