import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'compress',
  name: 'Compress Image',
  category: 'image',
  icon: 'arrows-minimize',
  summary: 'Shrink an image to a smaller file size.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
};

export default manifest;
