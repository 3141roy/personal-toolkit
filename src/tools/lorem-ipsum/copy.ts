export const copy = {
  lead: 'Give me',
  units: { paragraphs: 'Paragraphs', sentences: 'Sentences', words: 'Words' },
  classic: 'Start with "Lorem ipsum dolor sit amet"',
  html: 'Wrap in <p> tags',
  copy: 'Copy',
  copied: 'Copied',
  again: 'New text',
  stats: (words: number, chars: number) =>
    `${words.toLocaleString('en')} words, ${chars.toLocaleString('en')} characters`,
  limit: (max: number, unit: string) => `Up to ${max.toLocaleString('en')} ${unit.toLowerCase()}`,
  note: 'Cicero wrote it in 45 BC, I just shuffle it',
  noStore: 'Made here, shown here, never stored or sent.',
};
