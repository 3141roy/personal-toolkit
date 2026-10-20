import { wordlist } from '@scure/bip39/wordlists/english.js';

export type Rng = (max: number) => number;

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  ambiguous: boolean;
}

export interface PassphraseOptions {
  words: number;
  separator: string;
  capitalise: boolean;
  number: boolean;
}

export type Strength = 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

export type CrackUnit =
  | 'instant'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'years'
  | 'thousandYears'
  | 'millionYears'
  | 'billionYears'
  | 'beyond';

export type CharKind = 'letter' | 'digit' | 'symbol';

export const WORD_COUNT = wordlist.length;

export const PRESETS: Record<'strong' | 'readable' | 'pin', PasswordOptions> = {
  strong: { length: 16, lower: true, upper: true, digits: true, symbols: true, ambiguous: false },
  readable: { length: 16, lower: true, upper: true, digits: true, symbols: false, ambiguous: true },
  pin: { length: 6, lower: false, upper: false, digits: true, symbols: false, ambiguous: false },
};

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+?',
};

const AMBIGUOUS = /[Il1O0o]/g;
const GUESSES_PER_SECOND = 1e10;

export function secureInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function activePools(o: PasswordOptions): string[] {
  const kinds = (['lower', 'upper', 'digits', 'symbols'] as const).filter((k) => o[k]);
  return kinds.map((k) => (o.ambiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]));
}

export function generatePassword(o: PasswordOptions, rng: Rng = secureInt): string {
  const pools = activePools(o);
  if (!pools.length) return '';
  const all = pools.join('');
  const chars = pools.map((p) => p[rng(p.length)]);
  const length = Math.max(o.length, pools.length);
  while (chars.length < length) chars.push(all[rng(all.length)]);
  return shuffle(chars, rng).join('');
}

export function passwordEntropy(o: PasswordOptions): number {
  const size = activePools(o).join('').length;
  return size ? Math.max(o.length, activePools(o).length) * Math.log2(size) : 0;
}

export function generatePassphrase(
  o: PassphraseOptions,
  rng: Rng = secureInt,
  list: readonly string[] = wordlist,
): string {
  const parts: string[] = [];
  for (let i = 0; i < o.words; i++) {
    const word = list[rng(list.length)];
    parts.push(o.capitalise ? word[0].toUpperCase() + word.slice(1) : word);
  }
  if (o.number) parts.push(String(rng(100)));
  return parts.join(o.separator);
}

export function passphraseEntropy(o: PassphraseOptions, listSize: number = WORD_COUNT): number {
  return o.words * Math.log2(listSize) + (o.number ? Math.log2(100) : 0);
}

export function strength(bits: number): Strength {
  if (bits < 40) return 'weak';
  if (bits < 60) return 'fair';
  if (bits < 80) return 'good';
  if (bits < 100) return 'strong';
  return 'excellent';
}

export function crackTime(bits: number): { unit: CrackUnit; n: number } {
  const seconds = 2 ** (bits - 1) / GUESSES_PER_SECOND;
  const years = seconds / 31_557_600;
  if (seconds < 1) return { unit: 'instant', n: 0 };
  if (seconds < 60) return { unit: 'seconds', n: Math.round(seconds) };
  if (seconds < 3600) return { unit: 'minutes', n: Math.round(seconds / 60) };
  if (seconds < 86400) return { unit: 'hours', n: Math.round(seconds / 3600) };
  if (years < 1) return { unit: 'days', n: Math.round(seconds / 86400) };
  if (years < 1e3) return { unit: 'years', n: Math.round(years) };
  if (years < 1e6) return { unit: 'thousandYears', n: Math.round(years / 1e3) };
  if (years < 1e9) return { unit: 'millionYears', n: Math.round(years / 1e6) };
  if (years < 1.4e10) return { unit: 'billionYears', n: Math.round(years / 1e9) };
  return { unit: 'beyond', n: 0 };
}

export function charRuns(text: string): { text: string; kind: CharKind }[] {
  const runs: { text: string; kind: CharKind }[] = [];
  for (const ch of text) {
    const kind: CharKind = /[A-Za-z]/.test(ch) ? 'letter' : /\d/.test(ch) ? 'digit' : 'symbol';
    const last = runs[runs.length - 1];
    if (last && last.kind === kind) last.text += ch;
    else runs.push({ text: ch, kind });
  }
  return runs;
}
