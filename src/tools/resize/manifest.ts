import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'resize',
  name: 'Resize Image',
  category: 'image',
  icon: 'aspect-ratio',
  summary: 'Shrink or enlarge an image, in px or %.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
};

export default manifest;
