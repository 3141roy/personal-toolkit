export type JsonValidation = { valid: true } | { valid: false; message: string };

export function formatJson(input: string, indent = 2): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indent);
}

export function minifyJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

export function validateJson(input: string): JsonValidation {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (err) {
    return { valid: false, message: err instanceof Error ? err.message : 'Invalid JSON' };
  }
}

export function parseJsonSafe(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
}
