import { describe, it, expect } from 'vitest';
import { compareText, toSideBySideRows, toUnifiedPatch } from './textDiff';

describe('compareText', () => {
  it('reports no changes for identical text', () => {
    const result = compareText('a\nb\nc', 'a\nb\nc');
    expect(result.every((line) => line.type === 'unchanged')).toBe(true);
    expect(result.map((l) => l.text)).toEqual(['a', 'b', 'c']);
  });

  it('numbers unchanged lines the same on both sides', () => {
    const result = compareText('a\nb', 'a\nb');
    expect(result.map((l) => [l.beforeLine, l.afterLine])).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it('marks a pure insertion as added, without touching the unrelated lines around it', () => {
    const before = 'a\nb\nc';
    const after = 'a\nx\ny\nb\nc';
    const result = compareText(before, after);

    expect(result.map(({ type, text }) => ({ type, text }))).toEqual([
      { type: 'unchanged', text: 'a' },
      { type: 'added', text: 'x' },
      { type: 'added', text: 'y' },
      { type: 'unchanged', text: 'b' },
      { type: 'unchanged', text: 'c' },
    ]);
  });

  it('numbers a pure insertion so before-line stays null and after-line keeps counting', () => {
    const result = compareText('a\nb', 'a\nx\nb');
    expect(result.map((l) => [l.beforeLine, l.afterLine])).toEqual([
      [1, 1],
      [null, 2],
      [2, 3],
    ]);
  });

  it('treats a block moved later as a clean addition, not a confused word diff', () => {
    const before = 'a\nb\nc';
    const after = 'b\nc\na';
    const result = compareText(before, after);

    expect(result.map(({ type, text }) => ({ type, text }))).toEqual([
      { type: 'removed', text: 'a' },
      { type: 'unchanged', text: 'b' },
      { type: 'unchanged', text: 'c' },
      { type: 'added', text: 'a' },
    ]);
  });

  it('marks a pure deletion as removed', () => {
    const result = compareText('a\nb\nc', 'a\nc');
    expect(result.map(({ type, text }) => ({ type, text }))).toEqual([
      { type: 'unchanged', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'unchanged', text: 'c' },
    ]);
  });

  it('highlights the specific word that changed inside a modified line', () => {
    const result = compareText('the quick fox', 'the slow fox');
    const removed = result.find((l) => l.type === 'removed');
    const added = result.find((l) => l.type === 'added');

    expect(removed?.segments).toEqual([
      { value: 'the ', changed: false },
      { value: 'quick', changed: true },
      { value: ' fox', changed: false },
    ]);
    expect(added?.segments).toEqual([
      { value: 'the ', changed: false },
      { value: 'slow', changed: true },
      { value: ' fox', changed: false },
    ]);
  });

  it('highlights an inserted punctuation mark on the added side', () => {
    const result = compareText('hello world', 'hello, world');
    const added = result.find((l) => l.type === 'added');

    expect(added?.segments).toEqual([
      { value: 'hello', changed: false },
      { value: ',', changed: true },
      { value: ' world', changed: false },
    ]);
  });

  it('reconstructs the exact original line from the segments either side, spaces included', () => {
    const before = 'a line  with   odd spacing';
    const after = 'a line with odd spacing!';
    const result = compareText(before, after);

    const removed = result.find((l) => l.type === 'removed');
    const added = result.find((l) => l.type === 'added');

    expect(removed?.segments?.map((s) => s.value).join('')).toBe(before);
    expect(added?.segments?.map((s) => s.value).join('')).toBe(after);
  });

  it('ignoreWhitespace treats lines differing only in leading/trailing space as unchanged', () => {
    const result = compareText('a\n  b  \nc', 'a\nb\nc', { ignoreWhitespace: true });
    expect(result.every((line) => line.type === 'unchanged')).toBe(true);
  });

  it('ignoreCase treats lines differing only in case as unchanged', () => {
    const result = compareText('Hello\nWorld', 'hello\nworld', { ignoreCase: true });
    expect(result.every((line) => line.type === 'unchanged')).toBe(true);
  });
});

describe('toSideBySideRows', () => {
  it('pairs unchanged lines on both sides', () => {
    const lines = compareText('a\nb', 'a\nb');
    expect(toSideBySideRows(lines)).toEqual([
      { left: lines[0], right: lines[0] },
      { left: lines[1], right: lines[1] },
    ]);
  });

  it('pads the shorter run with null when a removed block and added block differ in size', () => {
    const lines = compareText('a\nb\nc', 'x');
    const rows = toSideBySideRows(lines);

    expect(lines.map((l) => ({ type: l.type, text: l.text }))).toEqual([
      { type: 'removed', text: 'a' },
      { type: 'added', text: 'x' },
      { type: 'removed', text: 'b' },
      { type: 'removed', text: 'c' },
    ]);
    expect(rows).toEqual([
      { left: lines[0], right: lines[1] },
      { left: lines[2], right: null },
      { left: lines[3], right: null },
    ]);
  });

  it('puts a pure addition on the right with a null left cell', () => {
    const lines = compareText('a', 'a\nb');
    expect(toSideBySideRows(lines)).toEqual([
      { left: lines[0], right: lines[0] },
      { left: null, right: lines[1] },
    ]);
  });
});

describe('toUnifiedPatch', () => {
  it('prefixes each line by its type', () => {
    const lines = compareText('a\nb', 'a\nc');
    expect(toUnifiedPatch(lines)).toBe('  a\n- b\n+ c');
  });
});
