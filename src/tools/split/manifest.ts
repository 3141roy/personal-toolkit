import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'split',
  name: 'Split PDF',
  category: 'pdf',
  icon: 'scissors',
  summary: 'Pull pages out of a PDF, by range or one file per page.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
};

export default manifest;
