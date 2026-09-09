import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'json-to-types',
  name: 'JSON to types',
  category: 'dev',
  icon: 'braces',
  summary: 'JSON sample to TypeScript, Zod, JSON Schema, or OpenAPI.',
  accepts: ['application/json'],
  produces: ['text/plain'],
  faq: [
    {
      q: 'How does it decide which fields are optional?',
      a: 'For an array of objects, a key that is missing from at least one element is marked optional. A single object has no optional keys, every key it shows is treated as required.',
    },
    {
      q: 'When does it add a format like email or uuid?',
      a: 'Only when every sampled string for that field matches, and it shows up in Zod (.email()) and in the JSON Schema and OpenAPI output. It detects email, uuid, url, date, and date-time. TypeScript has no refined string type, so those stay string.',
    },
    {
      q: 'Why did a string field become a literal or a union like "a" | "b"?',
      a: 'A string with a small set of repeated values (up to 12) is treated as an enum. Paste more records, or values over 40 characters, and it widens back to string.',
    },
    {
      q: 'When do array records split into a union of types?',
      a: 'When two records share no keys at all, they become separate types (A | B). Records that share any key are merged into one shape with the extra keys optional.',
    },
    {
      q: 'It got a type wrong. Why?',
      a: 'It infers from the sample you paste, not a spec. Paste a few representative records (an array) rather than one, so it sees the real range of each field.',
    },
  ],
};

export default manifest;
