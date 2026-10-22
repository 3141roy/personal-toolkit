import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'metadata',
  name: 'Image Metadata',
  h1: 'Image metadata viewer and EXIF remover',
  category: 'image',
  icon: 'file-info',
  summary: "See what's hiding in a photo's metadata, then edit or clear it.",
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  produces: ['image/jpeg', 'image/png', 'image/webp'],
  seo: {
    title: 'Image Metadata Editor and EXIF Remover - Free, No Upload - Bundle',
    description:
      'See the EXIF data hidden in a photo, including location. Keep some fields, edit others, or strip it all. Free, in your browser, nothing uploaded.',
  },
  related: [
    { id: 'compress', anchor: 'Compress the image' },
    { id: 'resize', anchor: 'Resize an image' },
  ],
  faq: [
    {
      q: 'What kind of metadata does it show?',
      a: 'EXIF data mostly: camera make and model, GPS coordinates if the photo has them, date taken, and similar embedded details. It also flags embedded XMP, IPTC and comments in JPEGs.',
    },
    {
      q: 'Can I keep some fields and remove the rest?',
      a: 'Yes, for JPEG. Tick the fields you want to keep and everything unticked is cleared. Select all and Unselect all flip every row at once.',
    },
    {
      q: 'Can I edit the metadata instead of removing it?',
      a: 'Yes, for JPEG. Change the camera make, software, dates and similar text, or add a description, artist or copyright the photo never had. Typing into a field keeps it.',
    },
    {
      q: 'Does this remove GPS location from my photos?',
      a: 'Yes, by default. Location is unticked, so it is stripped along with camera details and timestamps unless you choose to keep it.',
    },
    {
      q: 'Does saving change how the photo looks?',
      a: 'No. JPEGs are rewritten without re-encoding, so the picture data and quality stay identical.',
    },
    {
      q: 'Why is Orientation ticked by default?',
      a: 'It tells apps which way up the photo is. Removing it can make a portrait shot show sideways, so untick it only if you mean to.',
    },
    {
      q: 'What about PNG and WebP?',
      a: 'They are cleared in full. Picking fields to keep or edit works on JPEG only, and a PNG or WebP is re-saved with no metadata.',
    },
  ],
};

export default manifest;
