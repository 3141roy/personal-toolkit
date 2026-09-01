import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'resize',
  name: 'Resize Image',
  category: 'image',
  icon: 'aspect-ratio',
  summary: 'Shrink or enlarge an image, in px or %.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
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
