import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, validateJson } from './jsonFormat';

describe('formatJson / minifyJson', () => {
  it('stringifies with the right indent for format, none for minify', () => {
    const input = '{"a":1,"b":[1,2,3]}';
    expect(formatJson(input, 2)).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2,\n    3\n  ]\n}');
    expect(minifyJson('{\n  "a": 1,\n  "b": 2\n}')).toBe('{"a":1,"b":2}');
  });
});

describe('validateJson', () => {
  it('reports valid for well-formed JSON', () => {
    expect(validateJson('{"a":1}')).toEqual({ valid: true });
  });

  it('reports invalid with a message for malformed JSON', () => {
    const result = validateJson('{"a":}');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
