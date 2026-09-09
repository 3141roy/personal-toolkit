import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'images-to-pdf',
  name: 'Images to PDF',
  category: 'pdf',
  icon: 'file-type-pdf',
  summary: 'Turn photos or scans into one PDF.',
  accepts: ['image/png', 'image/jpeg'],
  produces: ['application/pdf'],
  seo: {
    title: 'Images to PDF - Convert JPG and PNG to PDF - Bundle',
    description:
      'Turn photos or scans into a single PDF, in the order you choose. Free, runs in your browser, nothing uploaded or logged.',
  },
  faq: [
    {
      q: 'What image formats can I use?',
      a: 'JPEG and PNG. Each image becomes its own page, at its original size, in the order you drop them.',
    },
    {
      q: 'What about WebP or HEIC?',
      a: 'Not supported directly yet. Convert HEIC iPhone photos with the HEIC to JPG tool first, then drop the result in here.',
    },
  ],
};

export default manifest;
