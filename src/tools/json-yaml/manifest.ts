import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'json-yaml',
  name: 'JSON to YAML',
  category: 'dev',
  icon: 'file-text',
  summary: 'Convert between JSON and YAML, either direction.',
  accepts: ['application/json', 'text/yaml', 'text/plain'],
  produces: ['application/json', 'text/yaml'],
  faq: [
    {
      q: 'Does it keep comments when converting YAML to JSON?',
      a: 'No, JSON has no concept of comments, so any `#` comments in the YAML are dropped in the output. The data itself carries over fine.',
    },
    {
      q: 'What about YAML anchors and references?',
      a: "Anchors and aliases (&name / *name) get resolved to their actual values before converting, since JSON can't represent them directly.",
    },
  ],
};

export default manifest;
