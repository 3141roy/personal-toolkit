import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'round-crop',
  name: 'Round Crop Image',
  category: 'image',
  icon: 'circle',
  summary: 'Crop a photo into a circle or square for profile pictures.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png'],
};

export default manifest;
