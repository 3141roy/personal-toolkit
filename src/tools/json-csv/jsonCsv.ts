function csvEscape(value: unknown, delimiter: string): string {
  const str = value === null || value === undefined ? '' : String(value);
  return /["\r\n]/.test(str) || str.includes(delimiter) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function jsonToCsv(input: string, delimiter = ','): string {
  const parsed = JSON.parse(input);
  const rows: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  if (rows.length === 0) return '';

  const headers = Array.from(
    rows.reduce((keys: Set<string>, row) => {
      if (row && typeof row === 'object') {
        for (const key of Object.keys(row)) keys.add(key);
      }
      return keys;
    }, new Set<string>()),
  );

  const lines = [headers.map((h) => csvEscape(h, delimiter)).join(delimiter)];
  for (const row of rows) {
    const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    lines.push(headers.map((h) => csvEscape(record[h], delimiter)).join(delimiter));
  }
  return lines.join('\r\n');
}

export function parseCsv(input: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

export function csvToJson(input: string, delimiter = ','): string {
  const rows = parseCsv(input, delimiter);
  if (rows.length === 0) return '[]';

  const [headers, ...dataRows] = rows;
  const objects = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? '';
    });
    return obj;
  });

  return JSON.stringify(objects, null, 2);
}
