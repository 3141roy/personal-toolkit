import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'bulk',
  name: 'Bulk process',
  category: 'image',
  icon: 'stack-2',
  summary: 'Resize, compress, or convert many images at once.',
  tier: 'core',
  runsOn: 'device',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  load: () => import('./BulkProcess.svelte'),
};

export default manifest;
