import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'resize',
  name: 'Resize Image',
  category: 'image',
  icon: 'aspect-ratio',
  summary: 'Shrink or enlarge an image, in px or %.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  seo: {
    title: 'Resize Image Online - by Pixels or Percent - Bundle',
    description:
      'Shrink or enlarge an image by pixel size or percentage, keeping aspect ratio, for profile photos, uploads or the web. Free, in your browser, nothing uploaded.',
  },
  related: [
    { id: 'compress', anchor: 'Compress the resized image' },
    { id: 'crop', anchor: 'Crop an image' },
    { id: 'round-crop', anchor: 'Crop a photo into a circle' },
  ],
  faq: [
    {
      q: 'Does it keep the image from stretching weird?',
      a: 'Scale by percentage and both dimensions move together automatically. Type exact width and height instead if you want full manual control, distortion included.',
    },
    {
      q: 'What formats does it accept?',
      a: 'PNG, JPEG, and WebP, and it outputs the same set.',
    },
  ],
};

export default manifest;
