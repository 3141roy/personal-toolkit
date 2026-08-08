import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'crop',
  name: 'Crop',
  category: 'image',
  icon: 'crop',
  summary: 'Trim an image down to a region.',
  tier: 'core',
  runsOn: 'device',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  load: () => import('./ImageCrop.svelte'),
};

export default manifest;
