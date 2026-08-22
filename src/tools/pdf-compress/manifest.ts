import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'pdf-compress',
  name: 'Compress PDF',
  category: 'pdf',
  icon: 'arrows-minimize',
  summary: 'Shrink a PDF to a smaller file size.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
};

export default manifest;
