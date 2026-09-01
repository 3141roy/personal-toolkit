import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'crop',
  name: 'Crop Image',
  category: 'image',
  icon: 'crop',
  summary: 'Trim an image down to a region.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  faq: [
    {
      q: 'Are there preset ratios like 1:1 or 16:9?',
      a: "Not yet, it's freeform. Drag the corners or edges to the exact region you want.",
    },
    {
      q: 'Can I crop the same image twice?',
      a: 'Sure, download the first crop, then drop that file back in for a second pass.',
    },
  ],
};

export default manifest;
