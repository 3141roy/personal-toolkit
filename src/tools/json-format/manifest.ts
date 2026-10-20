import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'json-format',
  name: 'JSON format',
  category: 'dev',
  icon: 'braces',
  summary: 'Format, minify, or validate JSON, with a tree view.',
  accepts: ['application/json', 'text/plain'],
  produces: ['application/json'],
  seo: {
    title: 'JSON Formatter, Validator and Minifier - Bundle',
    description:
      'Format, minify, or validate JSON with a collapsible tree view, so large payloads are easy to read. Free, runs in your browser, nothing uploaded or logged.',
  },
  related: [
    { id: 'json-yaml', anchor: 'Convert JSON to YAML' },
    { id: 'json-csv', anchor: 'Convert JSON to CSV' },
    { id: 'json-to-types', anchor: 'Generate types from JSON' },
  ],
  faq: [
    {
      q: 'What if my JSON has an error?',
      a: 'It tells you what went wrong and roughly where, so you can fix it instead of guessing.',
    },
    {
      q: "Format versus minify, what's the difference?",
      a: 'Format adds readable indentation. Minify strips all the whitespace down to the smallest possible size.',
    },
  ],
};

export default manifest;
