import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'convert',
  name: 'Convert Image',
  category: 'image',
  icon: 'refresh',
  summary: 'Change an image between PNG, JPEG, and WebP.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  seo: {
    title: 'Convert Image - PNG, JPEG and WebP - Bundle',
    description:
      'Change an image between PNG, JPEG, and WebP formats. Free, runs entirely in your browser, nothing uploaded and no signup.',
  },
  faq: [
    {
      q: 'Which formats can I convert between?',
      a: 'PNG, JPEG, and WebP, any of the three to any other.',
    },
    {
      q: 'Does converting lose quality?',
      a: "Going to JPEG or WebP can, since they're lossy formats. PNG is lossless, so converting to PNG never loses anything that was already there.",
    },
  ],
};

export default manifest;
