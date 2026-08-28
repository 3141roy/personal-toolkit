import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'merge',
  name: 'Merge PDF',
  category: 'pdf',
  icon: 'files',
  summary: 'Combine PDFs into one file, in the order you pick.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
};

export default manifest;
