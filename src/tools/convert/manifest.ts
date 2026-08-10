import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'convert',
  name: 'Convert',
  category: 'image',
  icon: 'refresh',
  summary: 'Change an image between PNG, JPEG, and WebP.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
};

export default manifest;
