export type Rng = (max: number) => number;
export type Unit = 'paragraphs' | 'sentences' | 'words';

export interface LoremOptions {
  unit: Unit;
  count: number;
  classicStart: boolean;
  html: boolean;
}

export const LIMITS: Record<Unit, { min: number; max: number }> = {
  paragraphs: { min: 1, max: 50 },
  sentences: { min: 1, max: 100 },
  words: { min: 1, max: 1000 },
};

export const WORDS = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco
laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse
cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia
deserunt mollit anim id est laborum at vero eos accusamus iusto odio dignissimos ducimus blanditiis
praesentium voluptatum deleniti atque corrupti quos dolores quas molestias excepturi occaecati
cupiditate provident similique mollitia animi perspiciatis unde omnis iste natus error voluptatem
accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis quasi
architecto beatae vitae dicta explicabo nemo ipsam quia voluptas aspernatur aut odit fugit
consequuntur magni ratione sequi nesciunt neque porro quisquam dolorem adipisci numquam eius modi
tempora incidunt`
  .split(/\s+/)
  .filter(Boolean);

const OPENER = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
const OPENER_COMMA_AFTER = 4;

const random: Rng = (max) => Math.floor(Math.random() * max);

export function clampCount(unit: Unit, n: number): number {
  const { min, max } = LIMITS[unit];
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
}

function pickWords(n: number, rng: Rng, prefix: string[] = []): string[] {
  const out = prefix.slice(0, n);
  while (out.length < n) {
    let i = rng(WORDS.length);
    if (WORDS[i] === out[out.length - 1]) i = (i + 1) % WORDS.length;
    out.push(WORDS[i]);
  }
  return out;
}

function capitalise(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

function sentence(rng: Rng, classic: boolean): string {
  if (classic) {
    const words = [...OPENER];
    words[OPENER_COMMA_AFTER] += ',';
    return `${capitalise(words.join(' '))}.`;
  }
  const n = 5 + rng(11);
  const words = pickWords(n, rng);
  if (n >= 8 && rng(3) > 0) words[3 + rng(n - 5)] += ',';
  return `${capitalise(words.join(' '))}.`;
}

function sentences(n: number, rng: Rng, classic: boolean): string[] {
  return Array.from({ length: n }, (_, i) => sentence(rng, classic && i === 0));
}

export function generate(o: LoremOptions, rng: Rng = random): string {
  const count = clampCount(o.unit, o.count);
  if (o.unit === 'words') {
    return pickWords(count, rng, o.classicStart ? OPENER : []).join(' ');
  }
  if (o.unit === 'sentences') {
    return sentences(count, rng, o.classicStart).join(' ');
  }
  const paragraphs = Array.from({ length: count }, (_, i) =>
    sentences(3 + rng(4), rng, o.classicStart && i === 0).join(' '),
  );
  return o.html ? paragraphs.map((p) => `<p>${p}</p>`).join('\n') : paragraphs.join('\n\n');
}

export function stats(text: string): { words: number; chars: number } {
  const plain = text.replace(/<[^>]+>/g, '');
  return { words: plain.split(/\s+/).filter(Boolean).length, chars: plain.length };
}
