import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'crop',
  name: 'Crop Image',
  category: 'image',
  icon: 'crop',
  summary: 'Trim an image down to a region.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  seo: {
    title: 'Crop Image Online - Free, No Upload - Bundle',
    description:
      'Trim an image down to any region, freeform or by preset ratio, and download the crop. Free, runs in your browser, nothing uploaded or logged.',
  },
  related: [
    { id: 'resize', anchor: 'Resize the cropped image' },
    { id: 'round-crop', anchor: 'Crop a photo into a circle' },
    { id: 'rotate', anchor: 'Rotate or flip an image' },
  ],
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
