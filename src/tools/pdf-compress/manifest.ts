import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'pdf-compress',
  name: 'Compress PDF',
  category: 'pdf',
  icon: 'arrows-minimize',
  summary: 'Shrink a PDF to a smaller file size.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
  faq: [
    {
      q: 'What actually gets smaller?',
      a: 'Two things: embedded photos get re-encoded smaller, and any leftover data nothing in the file actually points to (common after edits in other tools) gets dropped entirely. Text, links, and forms stay untouched.',
    },
    {
      q: 'Will it hurt the quality?',
      a: 'You set the quality before running it. Lower quality means a smaller file, and you get a preview before you download.',
    },
    {
      q: 'How do I get a PDF under 5MB for an upload form?',
      a: 'Lower the quality and check the size after it runs. Still too big, run it again a notch lower.',
    },
  ],
};

export default manifest;
