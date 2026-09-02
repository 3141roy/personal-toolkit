import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'merge',
  name: 'Merge PDF',
  category: 'pdf',
  icon: 'files',
  summary: 'Combine PDFs into one file, in the order you pick.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
  faq: [
    {
      q: 'How many PDFs can I merge?',
      a: 'As many as you drop in, minimum two. Reorder them with the arrows before merging.',
    },
    {
      q: 'Does merging lose any quality?',
      a: "No, pages are copied over exactly as they are, nothing gets recompressed or re-rendered. Bookmarks and interactive form fields don't carry over, but the page content itself is untouched.",
    },
    {
      q: 'Why is the merged file bigger than the originals added up?',
      a: 'Fonts and resources from each PDF carry over, and duplicates are not deduplicated. Run it through Compress PDF after if size matters.',
    },
  ],
};

export default manifest;
