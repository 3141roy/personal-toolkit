import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'round-crop',
  name: 'Round Crop Image',
  category: 'image',
  icon: 'circle',
  summary: 'Crop a photo into a circle or square for profile pictures.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png'],
  faq: [
    {
      q: 'Circle or square, can I pick?',
      a: "Yes, there's a toggle for both. Circle's the classic profile-picture crop, square is a plain center crop.",
    },
    {
      q: "What if my photo isn't square to start?",
      a: "Doesn't matter, position and size the crop area over whichever part you want. Works on any source shape.",
    },
  ],
};

export default manifest;
