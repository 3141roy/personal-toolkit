import { describe, it, expect } from 'vitest';
import { csvStats } from './csvStats';

describe('csvStats', () => {
  it('returns zeros for empty input', () => {
    expect(csvStats('')).toEqual({ rows: 0, columns: 0, columnStats: [] });
  });

  it('counts data rows and columns, header excluded from the row count', () => {
    const result = csvStats('name,age\nAnn,30\nBo,25');
    expect(result.rows).toBe(2);
    expect(result.columns).toBe(2);
  });

  it('infers number, boolean, and text columns', () => {
    const csv = 'n,flag,label\n1,true,a\n2,false,b\n3,true,c';
    const [n, flag, label] = csvStats(csv).columnStats;
    expect(n.type).toBe('number');
    expect(flag.type).toBe('boolean');
    expect(label.type).toBe('text');
  });

  it('a column with no filled cells is empty', () => {
    const [, note] = csvStats('id,note\n1,\n2,\n3,').columnStats;
    expect(note.type).toBe('empty');
  });

  it('a single non-numeric value makes the whole column text', () => {
    const [col] = csvStats('x\n1\n2\nn/a').columnStats;
    expect(col.type).toBe('text');
  });

  it('counts blank and whitespace-only cells as empties, left out of unique', () => {
    const [city] = csvStats('city,country\nOslo,NO\n ,NO\n,SE\nOslo,NO').columnStats;
    expect(city.empties).toBe(2);
    expect(city.unique).toBe(1);
  });

  it('handles CRLF line endings', () => {
    expect(csvStats('a,b\r\n1,2\r\n3,4\r\n').rows).toBe(2);
  });
});
