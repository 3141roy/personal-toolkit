import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'metadata',
  name: 'Image Metadata',
  category: 'image',
  icon: 'file-info',
  summary: "See what's hiding in a photo's metadata, and clear it.",
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  produces: ['image/jpeg', 'image/png', 'image/webp'],
  faq: [
    {
      q: 'What kind of metadata does it show?',
      a: 'EXIF data mostly: camera make, GPS coordinates if the photo has them, and similar embedded details.',
    },
    {
      q: 'Does clearing it change how the photo looks?',
      a: 'No, only the hidden metadata gets stripped. The image itself comes out identical.',
    },
  ],
};

export default manifest;
