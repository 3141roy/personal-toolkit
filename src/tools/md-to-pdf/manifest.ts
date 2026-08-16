import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'md-to-pdf',
  name: 'Markdown to PDF',
  category: 'pdf',
  icon: 'file-type-pdf',
  summary: 'Turn a markdown file into a PDF.',
  accepts: ['text/markdown', '.md'],
  produces: ['application/pdf'],
};

export default manifest;
