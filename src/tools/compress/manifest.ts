import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'compress',
  name: 'Compress',
  category: 'image',
  icon: 'arrows-minimize',
  summary: 'Shrink an image to a smaller file size.',
  tier: 'core',
  runsOn: 'device',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  load: () => import('./ImageCompress.svelte'),
};

export default manifest;
