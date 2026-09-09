import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'csv-stats',
  name: 'CSV stats',
  category: 'dev',
  icon: 'table',
  summary: 'Row and column counts, column type, empties, and uniques.',
  accepts: ['text/csv'],
  produces: ['text/plain'],
  faq: [
    {
      q: "How does it decide a column's type?",
      a: "If every filled cell in the column parses as a number it's number, if every one is true or false it's boolean, otherwise text. A column with no filled cells is empty.",
    },
    {
      q: 'What counts as empty?',
      a: "A cell that's blank or only whitespace. Those are left out of the unique count.",
    },
  ],
};

export default manifest;
