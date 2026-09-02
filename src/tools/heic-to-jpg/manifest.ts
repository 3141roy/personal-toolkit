import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'heic-to-jpg',
  name: 'HEIC to JPG',
  category: 'image',
  icon: 'photo',
  summary: 'Turn an iPhone photo into a regular JPG.',
  accepts: ['image/heic', 'image/heif'],
  produces: ['image/jpeg'],
  faq: [
    {
      q: 'Why do iPhone photos need converting at all?',
      a: "HEIC is Apple's format, and plenty of apps and older devices don't open it. JPG opens everywhere.",
    },
    {
      q: 'Does it work on HEIF too, not just HEIC?',
      a: 'Yes, both HEIC and HEIF go in, JPG comes out.',
    },
    {
      q: "Why won't my iPhone photos open on Windows?",
      a: 'Windows ships without HEIC support unless you install a codec. JPG opens on everything, so converting sidesteps it.',
    },
  ],
};

export default manifest;
