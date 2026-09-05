import { describe, it, expect } from 'vitest';
import { jsonToCsv, csvToJson, parseCsv } from './jsonCsv';

describe('jsonToCsv', () => {
  it('converts an array of objects, header from the union of keys', () => {
    const input = JSON.stringify([
      { name: 'Ann', age: 30 },
      { name: 'Bo', age: 25 },
    ]);
    expect(jsonToCsv(input)).toBe('name,age\r\nAnn,30\r\nBo,25');
  });

  it('fills missing keys with an empty field', () => {
    const input = JSON.stringify([{ name: 'Ann', age: 30 }, { name: 'Bo' }]);
    expect(jsonToCsv(input)).toBe('name,age\r\nAnn,30\r\nBo,');
  });

  it('quotes fields containing commas, quotes, or newlines', () => {
    const input = JSON.stringify([{ note: 'hi, "there"\nfriend' }]);
    expect(jsonToCsv(input)).toBe('note\r\n"hi, ""there""\nfriend"');
  });

  it('treats a single object as one row', () => {
    expect(jsonToCsv(JSON.stringify({ a: 1, b: 2 }))).toBe('a,b\r\n1,2');
  });

  it('returns empty string for an empty array', () => {
    expect(jsonToCsv('[]')).toBe('');
  });
});

describe('parseCsv', () => {
  it('splits plain rows on the delimiter', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps commas and newlines inside quoted fields', () => {
    expect(parseCsv('note\n"hi, ""there""\nfriend"')).toEqual([['note'], ['hi, "there"\nfriend']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('csvToJson', () => {
  it('uses the first row as keys', () => {
    const output = csvToJson('name,age\nAnn,30\nBo,25');
    expect(JSON.parse(output)).toEqual([
      { name: 'Ann', age: '30' },
      { name: 'Bo', age: '25' },
    ]);
  });

  it('round-trips with jsonToCsv', () => {
    const original = [
      { name: 'Ann', age: '30' },
      { name: 'Bo', age: '25' },
    ];
    const csv = jsonToCsv(JSON.stringify(original));
    expect(JSON.parse(csvToJson(csv))).toEqual(original);
  });

  it('returns an empty array for empty input', () => {
    expect(csvToJson('')).toBe('[]');
  });
});
