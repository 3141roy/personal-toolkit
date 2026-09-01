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
      a: 'Just the photos inside the PDF. Text, links, and forms stay untouched, only embedded images get re-encoded smaller.',
    },
    {
      q: 'Will it hurt the quality?',
      a: 'You set the quality before running it. Lower quality means a smaller file, and you get a preview before you download.',
    },
  ],
};

export default manifest;
