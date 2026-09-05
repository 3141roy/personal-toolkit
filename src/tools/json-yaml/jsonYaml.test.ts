import { describe, it, expect } from 'vitest';
import { jsonToYaml, yamlToJson } from './jsonYaml';

describe('jsonToYaml', () => {
  it('converts a flat object', () => {
    expect(jsonToYaml('{"name":"Ann","age":30}')).toBe('name: Ann\nage: 30\n');
  });

  it('converts nested objects and arrays', () => {
    const input = JSON.stringify({ user: { name: 'Ann' }, tags: ['a', 'b'] });
    expect(jsonToYaml(input)).toBe('user:\n  name: Ann\ntags:\n  - a\n  - b\n');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToYaml('{not json')).toThrow();
  });
});

describe('yamlToJson', () => {
  it('converts a flat mapping', () => {
    expect(JSON.parse(yamlToJson('name: Ann\nage: 30\n'))).toEqual({ name: 'Ann', age: 30 });
  });

  it('resolves anchors and aliases to their values', () => {
    const output = yamlToJson('a: &x 1\nb: *x\n');
    expect(JSON.parse(output)).toEqual({ a: 1, b: 1 });
  });

  it('drops comments, keeps the data', () => {
    const output = yamlToJson('# a comment\nname: Ann # inline comment\n');
    expect(JSON.parse(output)).toEqual({ name: 'Ann' });
  });

  it('round-trips with jsonToYaml', () => {
    const original = { user: { name: 'Ann' }, tags: ['a', 'b'] };
    expect(JSON.parse(yamlToJson(jsonToYaml(JSON.stringify(original))))).toEqual(original);
  });

  it('throws on malformed YAML', () => {
    expect(() => yamlToJson('a: [1, 2\n')).toThrow();
  });
});
