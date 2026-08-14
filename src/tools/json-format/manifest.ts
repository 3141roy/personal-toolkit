import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'json-format',
  name: 'JSON format',
  category: 'dev',
  icon: 'braces',
  summary: 'Format, minify, or validate JSON, with a tree view.',
  accepts: ['application/json', 'text/plain'],
  produces: ['application/json'],
};

export default manifest;
