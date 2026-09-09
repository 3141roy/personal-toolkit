import { parseCsv } from '../json-csv/jsonCsv';

export type ColumnType = 'number' | 'boolean' | 'text' | 'empty';

export interface ColumnStats {
  name: string;
  type: ColumnType;
  empties: number;
  unique: number;
}

export interface CsvStats {
  rows: number;
  columns: number;
  columnStats: ColumnStats[];
}

const isBlank = (value: string) => value.trim() === '';

function inferType(values: string[]): ColumnType {
  const filled = values.filter((value) => !isBlank(value));
  if (filled.length === 0) return 'empty';
  if (filled.every((value) => Number.isFinite(Number(value)))) return 'number';
  if (filled.every((value) => /^(true|false)$/i.test(value.trim()))) return 'boolean';
  return 'text';
}

export function csvStats(input: string, delimiter = ','): CsvStats {
  const grid = parseCsv(input, delimiter);
  if (grid.length === 0) return { rows: 0, columns: 0, columnStats: [] };

  const [headers, ...dataRows] = grid;
  const columnStats = headers.map((name, index) => {
    const values = dataRows.map((row) => row[index] ?? '');
    return {
      name,
      type: inferType(values),
      empties: values.filter(isBlank).length,
      unique: new Set(values.filter((value) => !isBlank(value))).size,
    };
  });

  return { rows: dataRows.length, columns: headers.length, columnStats };
}
