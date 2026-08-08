import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'rotate',
  name: 'Rotate & flip',
  category: 'image',
  icon: 'rotate',
  summary: 'Turn or mirror an image.',
  tier: 'core',
  runsOn: 'device',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  load: () => import('./ImageRotate.svelte'),
};

export default manifest;
