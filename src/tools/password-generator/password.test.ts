import { describe, it, expect } from 'vitest';
import {
  PRESETS,
  WORD_COUNT,
  charRuns,
  crackTime,
  generatePassphrase,
  generatePassword,
  passphraseEntropy,
  passwordEntropy,
  secureInt,
  strength,
  type PasswordOptions,
} from './password';

const opts = (over: Partial<PasswordOptions> = {}): PasswordOptions => ({
  length: 16,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  ambiguous: false,
  ...over,
});

describe('secureInt', () => {
  it('stays in range and covers every value', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const n = secureInt(6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
      seen.add(n);
    }
    expect(seen.size).toBe(6);
  });
});

describe('generatePassword', () => {
  it('returns the requested length', () => {
    expect(generatePassword(opts({ length: 40 }))).toHaveLength(40);
  });

  it('always includes one character from every enabled set', () => {
    for (let i = 0; i < 200; i++) {
      const p = generatePassword(opts({ length: 4 }));
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/\d/);
      expect(p).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it('uses only enabled sets', () => {
    expect(generatePassword(opts({ upper: false, symbols: false, length: 60 }))).toMatch(
      /^[a-z0-9]+$/,
    );
    expect(generatePassword(opts({ lower: false, upper: false, symbols: false }))).toMatch(/^\d+$/);
  });

  it('can leave out look-alike characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(generatePassword(opts({ length: 100, ambiguous: true }))).not.toMatch(/[Il1O0o]/);
    }
  });

  it('returns nothing when no set is enabled', () => {
    expect(
      generatePassword(opts({ lower: false, upper: false, digits: false, symbols: false })),
    ).toBe('');
  });

  it('is driven entirely by the injected rng', () => {
    const rng = () => 0;
    expect(generatePassword(opts({ length: 8 }), rng)).toBe(
      generatePassword(opts({ length: 8 }), rng),
    );
  });
});

describe('generatePassphrase', () => {
  const base = { words: 4, separator: '-', capitalise: false, number: false };

  it('joins the right number of words from the list', () => {
    const out = generatePassphrase(base).split('-');
    expect(out).toHaveLength(4);
    expect(out.every((w) => /^[a-z]+$/.test(w))).toBe(true);
  });

  it('capitalises and appends a number on request', () => {
    const out = generatePassphrase({ ...base, capitalise: true, number: true, separator: ' ' });
    expect(out).toMatch(/^([A-Z][a-z]+ ){4}\d{1,2}$/);
  });

  it('uses the injected list and rng', () => {
    expect(
      generatePassphrase({ ...base, words: 2, separator: '.' }, () => 1, ['a', 'b', 'c']),
    ).toBe('b.b');
  });
});

describe('entropy and strength', () => {
  it('computes password entropy from pool size and length', () => {
    expect(
      passwordEntropy(opts({ length: 10, upper: false, symbols: false, digits: false })),
    ).toBeCloseTo(10 * Math.log2(26), 5);
    expect(
      passwordEntropy(opts({ lower: false, upper: false, digits: false, symbols: false })),
    ).toBe(0);
  });

  it('computes passphrase entropy from list size', () => {
    expect(WORD_COUNT).toBe(2048);
    expect(passphraseEntropy({ words: 5, separator: '-', capitalise: false, number: false })).toBe(
      55,
    );
    expect(
      passphraseEntropy({ words: 5, separator: '-', capitalise: false, number: true }),
    ).toBeCloseTo(55 + Math.log2(100), 5);
  });

  it('buckets strength', () => {
    expect([30, 50, 70, 90, 120].map(strength)).toEqual([
      'weak',
      'fair',
      'good',
      'strong',
      'excellent',
    ]);
  });

  it('describes crack time at 10 billion guesses a second', () => {
    expect(crackTime(20).unit).toBe('instant');
    expect(crackTime(50).unit).toBe('hours');
    expect(crackTime(65).unit).toBe('years');
    expect(crackTime(80).unit).toBe('millionYears');
    expect(crackTime(128).unit).toBe('beyond');
  });
});

describe('charRuns', () => {
  it('groups consecutive characters by kind', () => {
    expect(charRuns('ab12-x')).toEqual([
      { text: 'ab', kind: 'letter' },
      { text: '12', kind: 'digit' },
      { text: '-', kind: 'symbol' },
      { text: 'x', kind: 'letter' },
    ]);
    expect(charRuns('')).toEqual([]);
  });
});

describe('presets', () => {
  it('all produce a password of the preset length', () => {
    for (const p of Object.values(PRESETS)) {
      expect(generatePassword(p)).toHaveLength(p.length);
    }
    expect(generatePassword(PRESETS.pin)).toMatch(/^\d{6}$/);
  });
});
