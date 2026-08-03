import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: '_template',
  name: 'Template',
  category: 'dev',
  icon: 'template',
  summary: 'Copy this folder to start a new tool.',
  tier: 'later',
  runsOn: 'device',
  accepts: [],
  produces: [],
  load: () => import('./Template.svelte'),
};

export default manifest;
