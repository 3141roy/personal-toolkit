import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'bulk',
  name: 'Bulk Image Tools',
  category: 'image',
  icon: 'stack-2',
  summary: 'Resize, compress, or convert many images at once.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
};

export default manifest;
