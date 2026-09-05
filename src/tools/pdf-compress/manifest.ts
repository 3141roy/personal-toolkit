import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'pdf-compress',
  name: 'Compress PDF',
  category: 'pdf',
  icon: 'arrows-minimize',
  summary: 'Shrink a PDF to a smaller file size.',
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
  faq: [
    {
      q: 'What actually gets smaller?',
      a: 'Two things: embedded images get re-encoded as JPEG at your chosen quality, and any object nothing in the file actually points to (dead weight left over from edits in other tools or PDF generators) gets dropped entirely before that. Text, links, and forms stay untouched.',
    },
    {
      q: 'Which image encodings does it handle?',
      a: "JPEG (DCTDecode) in any colorspace, including CMYK, always gets re-encoded. Raw bitmaps (FlateDecode) get the same treatment only if they're 8-bit DeviceRGB or DeviceGray with no predictor or a TIFF-style horizontal predictor (Predictor 2). PNG-style predictors (Predictor 15), CCITT fax, JBIG2, and indexed color stay untouched.",
    },
    {
      q: 'Will it hurt the quality?',
      a: 'You set the quality before running it. Lower quality means a smaller file, and you get a preview before you download. The quality slider maps to a JPEG quality between 20 and 95 and a max image dimension between 800 and 2400px, so extremely low settings still keep a usable image rather than going to zero.',
    },
    {
      q: 'How do I get a PDF under 5MB for an upload form?',
      a: "Lower the quality and check the size after it runs. Still too big, run it again a notch lower. If most of the size is a scanned image using an encoding this tool skips (see above), lowering quality won't help since that image is never touched.",
    },
  ],
};

export default manifest;
