import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'heic-to-jpg',
  name: 'HEIC to JPG',
  category: 'image',
  icon: 'photo',
  summary: 'Turn an iPhone photo into a regular JPG.',
  tier: 'core',
  runsOn: 'device',
  accepts: ['image/heic', 'image/heif'],
  produces: ['image/jpeg'],
  load: () => import('./HeicToJpg.svelte'),
};

export default manifest;
