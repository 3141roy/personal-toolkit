export interface TextCounts {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
}

export function countText(input: string): TextCounts {
  const trimmed = input.trim();

  return {
    words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
    characters: input.length,
    charactersNoSpaces: input.replace(/\s/g, '').length,
    lines: input === '' ? 0 : input.split('\n').length,
  };
}
