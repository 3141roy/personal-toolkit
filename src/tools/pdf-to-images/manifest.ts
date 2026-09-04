import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'pdf-to-images',
  name: 'PDF to Images',
  category: 'image',
  icon: 'photo',
  summary: 'Export every page of a PDF as JPG or PNG.',
  accepts: ['application/pdf'],
  produces: ['image/jpeg', 'image/png'],
  faq: [
    {
      q: 'What image format do I get?',
      a: 'JPEG or PNG, your choice before exporting. JPEG is smaller and has a quality slider, PNG is lossless and better if a page has sharp text or line art.',
    },
    {
      q: 'What resolution are the exported pages?',
      a: "Pages render at twice their point size, sharper than a typical screen. That's fixed for now, not tied to your display or adjustable per export.",
    },
  ],
};

export default manifest;
