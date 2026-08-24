import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'crop',
  name: 'Crop Image',
  category: 'image',
  icon: 'crop',
  summary: 'Trim an image down to a region.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
};

export default manifest;
