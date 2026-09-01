import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'bulk',
  name: 'Bulk Image Tools',
  category: 'image',
  icon: 'stack-2',
  summary: 'Resize, compress, or convert many images at once.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  faq: [
    {
      q: 'What operations can I run in bulk?',
      a: 'Resize, compress, or convert, one operation across every file you drop in at once.',
    },
    {
      q: 'Can I use different settings per file?',
      a: 'No, one setting applies to the whole batch. Run it again with different settings for a different subset.',
    },
  ],
};

export default manifest;
