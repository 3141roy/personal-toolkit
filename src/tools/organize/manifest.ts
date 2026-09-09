import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'organize',
  name: 'Organize PDF',
  category: 'pdf',
  icon: 'arrows-sort',
  summary: 'Reorder, delete, or pull in pages from other PDFs.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
  seo: {
    title: 'Organize PDF Pages - Reorder, Delete, Insert - Bundle',
    description:
      'Reorder, delete, or pull in pages from other PDFs, then download. Free, runs in your browser, nothing uploaded or logged.',
  },
  faq: [
    {
      q: 'What does "insert" mean here?',
      a: 'Drop another PDF onto the page list. Its pages join the list too, then you drag or arrow them wherever you want.',
    },
    {
      q: 'Can I combine pages from different PDFs?',
      a: "Yes, that's the point. Drop more than one file and mix pages from all of them into one output.",
    },
  ],
};

export default manifest;
