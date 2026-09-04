import { parse, stringify } from 'yaml';

export function jsonToYaml(input: string): string {
  const parsed = JSON.parse(input);
  return stringify(parsed);
}

export function yamlToJson(input: string): string {
  const parsed = parse(input);
  return JSON.stringify(parsed, null, 2);
}
