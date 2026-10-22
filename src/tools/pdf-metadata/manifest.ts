import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'pdf-metadata',
  name: 'PDF Metadata',
  category: 'pdf',
  icon: 'file-info',
  summary: "See what's hiding in a PDF's metadata, then edit or clear it.",
  cardSummary: "See, edit or clear a PDF's hidden metadata.",
  accepts: ['application/pdf'],
  produces: ['application/pdf'],
  seo: {
    title: 'PDF Metadata Editor and Remover - Free, No Upload - Bundle',
    description:
      'See the author, software and dates hidden in a PDF, then edit or strip them out. Free, runs entirely in your browser, so the file never leaves your device.',
  },
  related: [
    { id: 'pdf-compress', anchor: 'Compress a PDF' },
    { id: 'pdf-password', anchor: 'Password protect a PDF' },
  ],
  faq: [
    {
      q: 'Can I keep some fields and remove the rest?',
      a: 'Yes. Tick the fields you want to keep, and everything unticked is cleared. Select all and Unselect all flip every row at once.',
    },
    {
      q: 'Can I change the title or author instead of removing it?',
      a: 'Yes. Type a new value in the field, or fill in one the PDF never had. Dates can only be kept or cleared.',
    },
    {
      q: 'What metadata does a PDF carry?',
      a: 'Title, author, subject, keywords, the software that made it, and creation and edit dates. Many files also embed an XMP block that repeats this and adds edit history.',
    },
    {
      q: 'Does clearing it change how the PDF looks?',
      a: 'No. Pages, text and images stay as they are. Only the hidden document details are removed.',
    },
    {
      q: 'Does it remove comment authors or text inside the pages?',
      a: 'No. Annotations and page content are left alone, so a name typed into a page or a comment stays. Check those yourself before sharing.',
    },
    {
      q: 'Why does an edited title still show the old one elsewhere?',
      a: 'Some PDFs also embed an XMP copy of the details, and viewers may read that instead. Untick Embedded XMP to clear it.',
    },
    {
      q: 'Is the file uploaded anywhere?',
      a: 'No. It is read and rewritten in your browser, so the file never leaves your device.',
    },
  ],
};

export default manifest;
