import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'rotate',
  name: 'Rotate & Flip Image',
  category: 'image',
  icon: 'rotate',
  summary: 'Turn or mirror an image.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  faq: [
    {
      q: 'Can I rotate by an exact angle, not just 90°?',
      a: 'Not right now, rotation moves in 90° steps. Flip horizontal or vertical works at any point though.',
    },
    {
      q: 'Can I combine a rotate and a flip?',
      a: 'Yes, stack as many rotates and flips as you want before running it.',
    },
  ],
};

export default manifest;
