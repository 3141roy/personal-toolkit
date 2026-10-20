import type { ToolManifest } from '../types';

const conversions = [
  {
    slug: 'png-to-jpg',
    from: 'image/png',
    to: 'image/jpeg',
    h1: 'Convert PNG to JPG',
    title: 'PNG to JPG Converter - Free, No Upload - Bundle',
    description:
      'Turn a PNG into a JPG that opens everywhere, and usually a much smaller file for photos. Free, runs entirely in your browser, nothing uploaded and no signup.',
    note: 'JPG has no transparency, so see-through areas turn white. Photos usually get much smaller. Keep the PNG for logos and screenshots with sharp text.',
  },
  {
    slug: 'jpg-to-png',
    from: 'image/jpeg',
    to: 'image/png',
    h1: 'Convert JPG to PNG',
    title: 'JPG to PNG Converter - Free, No Upload - Bundle',
    description:
      'Turn a JPG into a lossless PNG, handy when a form insists on PNG. Free, runs entirely in your browser, nothing uploaded and no signup.',
    note: "PNG is lossless, but it can't bring back detail the JPG already threw away. Expect a bigger file that looks the same. Handy when a form insists on PNG.",
  },
  {
    slug: 'webp-to-jpg',
    from: 'image/webp',
    to: 'image/jpeg',
    h1: 'Convert WebP to JPG',
    title: 'WebP to JPG Converter - Free, No Upload - Bundle',
    description:
      'Turn a WebP image into a JPG for email clients, editors and upload forms that reject WebP. Free, runs entirely in your browser, nothing uploaded and no signup.',
    note: 'Some email clients, older editors and upload forms still reject WebP. JPG opens everywhere. Transparent areas turn white.',
  },
  {
    slug: 'webp-to-png',
    from: 'image/webp',
    to: 'image/png',
    h1: 'Convert WebP to PNG',
    title: 'WebP to PNG Converter - Free, No Upload - Bundle',
    description:
      'Turn a WebP image into a PNG that keeps transparency and is accepted almost everywhere. Free, runs entirely in your browser, nothing uploaded and no signup.',
    note: 'PNG keeps WebP transparency and is accepted almost everywhere. The file usually grows a lot, since PNG compresses photos poorly.',
  },
  {
    slug: 'jpg-to-webp',
    from: 'image/jpeg',
    to: 'image/webp',
    h1: 'Convert JPG to WebP',
    title: 'JPG to WebP Converter - Free, No Upload - Bundle',
    description:
      'Turn a JPG into a WebP for the web, usually smaller at similar quality. Free, runs entirely in your browser, nothing uploaded and no signup.',
    note: 'WebP is usually smaller than JPG at similar quality. Recompressing loses a little more detail, so keep your original. Very old software may not open WebP.',
  },
  {
    slug: 'png-to-webp',
    from: 'image/png',
    to: 'image/webp',
    h1: 'Convert PNG to WebP',
    title: 'PNG to WebP Converter - Free, No Upload - Bundle',
    description:
      'Turn a PNG into a WebP that keeps transparency and is often far smaller. Free, runs entirely in your browser, nothing uploaded and no signup.',
    note: "WebP keeps transparency and is often far smaller than PNG, which suits web images. Some older editors and upload forms don't accept it.",
  },
];

const manifest: ToolManifest = {
  id: 'convert',
  name: 'Convert Image',
  category: 'image',
  icon: 'refresh',
  summary: 'Change an image between PNG, JPEG, and WebP.',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],
  seo: {
    title: 'Convert Image - PNG, JPEG and WebP - Bundle',
    description:
      'Change an image between PNG, JPEG, and WebP formats, any of the three to any other. Free, runs entirely in your browser, nothing uploaded and no signup.',
  },
  related: [
    { id: 'compress', anchor: 'Compress the converted image' },
    { id: 'heic-to-jpg', anchor: 'Convert an iPhone HEIC photo to JPG' },
    { id: 'resize', anchor: 'Resize an image' },
  ],
  faq: [
    {
      q: 'Which formats can I convert between?',
      a: 'PNG, JPEG, and WebP, any of the three to any other.',
    },
    {
      q: 'Does converting lose quality?',
      a: "Going to JPEG or WebP can, since they're lossy formats. PNG is lossless, so converting to PNG never loses anything that was already there.",
    },
  ],
  linkVariants: true,
  variants: conversions.map(({ from, to, ...page }) => ({
    ...page,
    props: {
      target: to,
      from,
      redirects: Object.fromEntries(
        conversions
          .filter((other) => other.to === to && other.slug !== page.slug)
          .map((other) => [other.from, { href: `/image/${other.slug}/`, label: other.h1 }]),
      ),
      fallback: { href: '/image/convert/', label: 'Convert Image' },
    },
  })),
};

export default manifest;
