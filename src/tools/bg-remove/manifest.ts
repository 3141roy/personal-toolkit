import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'bg-remove',
  name: 'Remove Background',
  category: 'image',
  icon: 'eraser',
  summary: "Cut a photo's background out, on your device.",
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png'],
  seo: {
    title: 'Remove Image Background Online - Free, In Your Browser - Bundle',
    description:
      "Cut the background out of a photo. Runs a small model on your device after a one-time download, nothing uploaded.",
  },
  faq: [
    {
      q: 'Does this upload my photo anywhere?',
      a: 'No. The model downloads once and everything after runs in your browser.',
    },
    {
      q: 'Why does it need to download something first?',
      a: "The background-removal model is about 4MB. Your browser caches it after the first run, so it's a one-time cost.",
    },
  ],
};

export default manifest;
