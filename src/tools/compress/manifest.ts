import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'compress',
  name: 'Compress Image',
  category: 'image',
  icon: 'arrows-minimize',
  summary: 'Shrink an image to a smaller file size.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  faq: [
    {
      q: 'Which format keeps the most quality?',
      a: 'WebP usually compresses smallest for the same visual quality. PNG is lossless, so the quality slider does nothing there, it just optimizes the file structure.',
    },
    {
      q: 'How do I pick the right quality?',
      a: "Drag the slider and check the preview before downloading. There's no one right number, it depends on the image.",
    },
  ],
};

export default manifest;
