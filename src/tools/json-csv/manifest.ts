import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'json-csv',
  name: 'JSON to CSV',
  category: 'dev',
  icon: 'table',
  summary: 'Convert between JSON and CSV, either direction.',
  accepts: ['application/json', 'text/csv', 'text/plain'],
  produces: ['application/json', 'text/csv'],
  faq: [
    {
      q: 'What JSON shape does this expect?',
      a: 'An array of flat objects, like `[{"name":"Ann","age":30}]`. A single object works too, treated as one row. Nested objects or arrays inside a field get stringified as-is, not split into columns.',
    },
    {
      q: 'Does it handle commas and quotes inside a field?',
      a: 'Yes, fields with commas, quotes, or line breaks get quoted the way spreadsheets expect (RFC 4180), both reading CSV in and writing it out.',
    },
  ],
};

export default manifest;
