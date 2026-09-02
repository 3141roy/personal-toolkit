import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'split',
  name: 'Split PDF',
  category: 'pdf',
  icon: 'scissors',
  summary: 'Pull pages out of a PDF, by range or one file per page.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
  faq: [
    {
      q: "What if I don't know exact page numbers?",
      a: 'Pick "every page" mode instead, it splits into one file per page automatically.',
    },
    {
      q: 'Can I do multiple ranges at once?',
      a: 'Yes, separate them with commas, like "1-3, 5, 8-10". Each range becomes its own file.',
    },
    {
      q: 'How do I pull one page out of a PDF?',
      a: 'Use ranges mode and enter that one page number, like "4". You get a single page PDF back.',
    },
  ],
};

export default manifest;
