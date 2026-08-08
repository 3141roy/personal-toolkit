import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'resize',
  name: 'Resize',
  category: 'image',
  icon: 'aspect-ratio',
  summary: 'Shrink or enlarge an image, in px or %.',
  tier: 'core',
  runsOn: 'device',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  load: () => import('./ImageResize.svelte'),
};

export default manifest;
