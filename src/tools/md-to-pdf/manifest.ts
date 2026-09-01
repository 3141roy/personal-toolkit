import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'md-to-pdf',
  name: 'Markdown to PDF',
  category: 'pdf',
  icon: 'file-type-pdf',
  summary: 'Turn a markdown file into a PDF.',
  accepts: ['text/markdown', '.md'],
  produces: ['application/pdf'],
  faq: [
    {
      q: 'What Markdown does it support?',
      a: 'The standard stuff: headings, lists, links, bold, italic, code blocks. No custom HTML or CSS.',
    },
    {
      q: 'Can I style the PDF?',
      a: 'Not yet. It uses one clean default look, good for a quick readable document, not pixel-perfect design.',
    },
  ],
};

export default manifest;
