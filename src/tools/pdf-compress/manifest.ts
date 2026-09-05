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
      a: 'Two things: the images inside get re-saved smaller at the quality you pick, and any leftover data nothing in the file points to anymore (old edits, deleted pages, generator junk) gets dropped. Text, links, and forms are never touched.',
    },
    {
      q: 'Which images does it shrink?',
      a: "Ordinary photos and screenshots, which is most of what makes a PDF big. Scans and print-shop files often store images in formats this tool can't read (fax, JBIG2, palette color, print CMYK); those get left exactly as they were rather than guessed at.",
    },
    {
      q: 'Will it hurt the quality?',
      a: 'You set the quality before running it, and you see the result before you download. Even the lowest setting stops well short of unreadable, so it never turns your images to mush.',
    },
    {
      q: 'How do I get a PDF under 5MB for an upload form?',
      a: "Lower the quality and check the size after it runs. Still too big, run it again a notch lower. If the size is one big scan this tool can't read, no setting will help, it's leaving that image alone.",
    },
  ],
};

export default manifest;
