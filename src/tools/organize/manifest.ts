import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'organize',
  name: 'Organize PDF',
  category: 'pdf',
  icon: 'arrows-sort',
  summary: 'Reorder, delete, or pull in pages from other PDFs.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
};

export default manifest;
