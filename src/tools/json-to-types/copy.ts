export const copy = {
  empty: 'Paste a JSON sample here. An array of records reads best.',
  invalidJson: (message: string) => `That's not valid JSON: ${message}`,
  targets: {
    typescript: 'TypeScript',
    zod: 'Zod',
    'json-schema': 'JSON Schema',
    openapi: 'OpenAPI',
  },
  copyButton: 'Copy',
  copied: 'Copied.',
  note: 'inferred from your sample, on your machine',
};
