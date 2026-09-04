import { diffArrays, diffWordsWithSpace } from 'diff';

export interface DiffSegment {
  value: string;
  changed: boolean;
}

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
  beforeLine: number | null;
  afterLine: number | null;
  segments?: DiffSegment[];
}

export interface CompareOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
}

export interface SideBySideRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

function splitLines(value: string): string[] {
  const lines = value.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export function compareText(
  before: string,
  after: string,
  options: CompareOptions = {},
): DiffLine[] {
  function normalize(line: string): string {
    let value = line;
    if (options.ignoreWhitespace) value = value.trim();
    if (options.ignoreCase) value = value.toLowerCase();
    return value;
  }

  const parts = diffArrays(splitLines(before), splitLines(after), {
    comparator: (a, b) => normalize(a) === normalize(b),
  });
  const result: DiffLine[] = [];
  let beforeNum = 0;
  let afterNum = 0;

  function pushUnchanged(text: string) {
    beforeNum++;
    afterNum++;
    result.push({ type: 'unchanged', text, beforeLine: beforeNum, afterLine: afterNum });
  }
  function pushRemoved(text: string, segments?: DiffSegment[]) {
    beforeNum++;
    result.push({ type: 'removed', text, beforeLine: beforeNum, afterLine: null, segments });
  }
  function pushAdded(text: string, segments?: DiffSegment[]) {
    afterNum++;
    result.push({ type: 'added', text, beforeLine: null, afterLine: afterNum, segments });
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part.added && !part.removed) {
      for (const text of part.value) pushUnchanged(text);
      continue;
    }

    if (part.removed) {
      const removedLines = part.value;
      const next = parts[i + 1];

      if (next?.added) {
        const addedLines = next.value;
        const pairCount = Math.min(removedLines.length, addedLines.length);

        for (let j = 0; j < pairCount; j++) {
          if (removedLines[j] === addedLines[j]) {
            pushUnchanged(removedLines[j]);
            continue;
          }

          const words = diffWordsWithSpace(removedLines[j], addedLines[j], {
            ignoreCase: options.ignoreCase,
          });
          pushRemoved(
            removedLines[j],
            words
              .filter((w) => !w.added)
              .map((w) => ({ value: w.value, changed: Boolean(w.removed) })),
          );
          pushAdded(
            addedLines[j],
            words
              .filter((w) => !w.removed)
              .map((w) => ({ value: w.value, changed: Boolean(w.added) })),
          );
        }
        for (let j = pairCount; j < removedLines.length; j++) pushRemoved(removedLines[j]);
        for (let j = pairCount; j < addedLines.length; j++) pushAdded(addedLines[j]);
        i++;
        continue;
      }

      for (const text of removedLines) pushRemoved(text);
      continue;
    }

    for (const text of part.value) pushAdded(text);
  }

  return result;
}

export function toSideBySideRows(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === 'unchanged') {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }

    const removedRun: DiffLine[] = [];
    while (lines[i]?.type === 'removed') removedRun.push(lines[i++]);
    const addedRun: DiffLine[] = [];
    while (lines[i]?.type === 'added') addedRun.push(lines[i++]);

    const max = Math.max(removedRun.length, addedRun.length);
    for (let j = 0; j < max; j++) {
      rows.push({ left: removedRun[j] ?? null, right: addedRun[j] ?? null });
    }
  }

  return rows;
}

export function toUnifiedPatch(lines: DiffLine[]): string {
  const marker = { unchanged: '  ', added: '+ ', removed: '- ' } as const;
  return lines.map((line) => `${marker[line.type]}${line.text}`).join('\n');
}
