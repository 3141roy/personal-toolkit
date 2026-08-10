import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'rotate',
  name: 'Rotate & flip',
  category: 'image',
  icon: 'rotate',
  summary: 'Turn or mirror an image.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
};

export default manifest;
