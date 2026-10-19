import { describe, it, expect } from 'vitest';
import { WORDS, clampCount, generate, stats, type LoremOptions } from './lorem';

const opts = (over: Partial<LoremOptions> = {}): LoremOptions => ({
  unit: 'paragraphs',
  count: 3,
  classicStart: true,
  html: false,
  ...over,
});

const sentencesOf = (text: string) => text.split(/(?<=\.)\s+/).filter(Boolean);

describe('word list', () => {
  it('has no duplicates', () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
    expect(WORDS.length).toBeGreaterThan(120);
  });
});

describe('clampCount', () => {
  it('keeps counts inside each unit range', () => {
    expect(clampCount('paragraphs', 0)).toBe(1);
    expect(clampCount('paragraphs', 999)).toBe(50);
    expect(clampCount('words', 5000)).toBe(1000);
    expect(clampCount('sentences', 2.6)).toBe(3);
    expect(clampCount('words', NaN)).toBe(1);
  });
});

describe('generate words', () => {
  it('returns exactly the requested number of words', () => {
    for (const n of [1, 7, 8, 50, 400]) {
      expect(stats(generate(opts({ unit: 'words', count: n }))).words).toBe(n);
    }
  });

  it('starts with the classic opener, or does not', () => {
    expect(generate(opts({ unit: 'words', count: 5 }))).toBe('lorem ipsum dolor sit amet');
    const plain = generate(opts({ unit: 'words', count: 8, classicStart: false }), () => 40);
    expect(plain.startsWith('lorem ipsum')).toBe(false);
  });

  it('never repeats a word back to back', () => {
    const words = generate(opts({ unit: 'words', count: 300, classicStart: false }), () => 0).split(
      ' ',
    );
    words.forEach((w, i) => {
      if (i) expect(w).not.toBe(words[i - 1]);
    });
  });
});

describe('generate sentences', () => {
  it('returns the requested number of capitalised, period-ended sentences', () => {
    const out = sentencesOf(generate(opts({ unit: 'sentences', count: 12 })));
    expect(out).toHaveLength(12);
    for (const s of out) {
      expect(s).toMatch(/^[A-Z]/);
      expect(s.endsWith('.')).toBe(true);
    }
  });

  it('opens with the classic sentence and keeps its comma', () => {
    expect(
      generate(opts({ unit: 'sentences', count: 2 })).startsWith(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      ),
    ).toBe(true);
  });

  it('puts commas only inside a sentence', () => {
    for (let i = 0; i < 100; i++) {
      for (const s of sentencesOf(
        generate(opts({ unit: 'sentences', count: 5, classicStart: false })),
      )) {
        expect(s).not.toMatch(/^[^,]{0,8},/);
        expect(s).not.toMatch(/,\.$/);
        expect(s.split(',').length).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('generate paragraphs', () => {
  it('returns the requested number of paragraphs of 3 to 6 sentences', () => {
    for (let i = 0; i < 50; i++) {
      const paras = generate(opts({ count: 6 })).split('\n\n');
      expect(paras).toHaveLength(6);
      for (const p of paras) {
        const n = sentencesOf(p).length;
        expect(n).toBeGreaterThanOrEqual(3);
        expect(n).toBeLessThanOrEqual(6);
      }
    }
  });

  it('only the first paragraph gets the classic opener', () => {
    const paras = generate(opts({ count: 4 })).split('\n\n');
    expect(paras[0].startsWith('Lorem ipsum dolor sit amet,')).toBe(true);
    expect(paras.slice(1).some((p) => p.startsWith('Lorem ipsum dolor sit amet,'))).toBe(false);
  });

  it('wraps each paragraph in p tags when html is on', () => {
    const lines = generate(opts({ count: 3, html: true })).split('\n');
    expect(lines).toHaveLength(3);
    for (const l of lines) expect(l).toMatch(/^<p>.+<\/p>$/);
  });
});

describe('stats', () => {
  it('ignores html tags when counting', () => {
    expect(stats('<p>one two</p>\n<p>three</p>')).toEqual({ words: 3, chars: 13 });
  });
});
