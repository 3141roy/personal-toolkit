import { describe, it, expect } from 'vitest';
import { countText } from './textCount';

describe('countText', () => {
  it('returns all zeros for empty input', () => {
    expect(countText('')).toEqual({
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 0,
    });
  });

  it('counts words split on whitespace, ignoring extra spaces', () => {
    expect(countText('hello   world').words).toBe(2);
    expect(countText('  leading and trailing  ').words).toBe(3);
  });

  it('keeps hyphenated and apostrophe words as a single word', () => {
    expect(countText("well-known don't stop").words).toBe(3);
  });

  it('counts every character, spaces included', () => {
    expect(countText('a b').characters).toBe(3);
  });

  it('counts characters without whitespace separately', () => {
    expect(countText('a b\nc').charactersNoSpaces).toBe(3);
  });

  it('counts lines by line breaks, including a trailing blank line', () => {
    expect(countText('a').lines).toBe(1);
    expect(countText('a\nb').lines).toBe(2);
    expect(countText('a\nb\n').lines).toBe(3);
  });

  it('treats whitespace-only input as zero words but real lines/characters', () => {
    const result = countText('   \n  ');
    expect(result.words).toBe(0);
    expect(result.lines).toBe(2);
    expect(result.characters).toBe(6);
  });
});
