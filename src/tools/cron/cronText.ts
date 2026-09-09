import type { CronField, ParsedCron } from './cron';

export interface Description {
  text: string;
  warning?: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function list(items: string[], conj = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conj} ${items[items.length - 1]}`;
}

function single(f: CronField): number | null {
  if (f.values.size === 1 && f.tokens.every((t) => t.t === 'value')) return [...f.values][0];
  return null;
}

function stepAll(f: CronField, min: number, max: number): number | null {
  if (f.tokens.length === 1 && f.tokens[0].t === 'step') {
    const t = f.tokens[0];
    if (t.from === min && t.to === max) return t.step;
  }
  return null;
}

function soleRange(f: CronField): { from: number; to: number } | null {
  if (f.tokens.length === 1 && f.tokens[0].t === 'range') {
    return { from: f.tokens[0].from, to: f.tokens[0].to };
  }
  return null;
}

function plainValues(f: CronField): number[] {
  return [...f.values].sort((a, b) => a - b);
}

function timePhrase(cron: ParsedCron): string {
  const { minute: mi, hour: h } = cron;
  const q = cron.dialect === 'quartz';
  const s = cron.second;

  const secStep = q ? stepAll(s, 0, 59) : null;
  const secOne = q ? single(s) : 0;
  const secWild = q && s.wildcard;

  const miStep = stepAll(mi, 0, 59);
  const miOne = single(mi);
  const hOne = single(h);
  const hRange = soleRange(h);
  const hStep = stepAll(h, 0, 23);

  if (secWild) {
    if (mi.wildcard && h.wildcard) return 'every second';
    return `every second, ${betweenHours(cron)}`.replace(/, $/, '');
  }
  if (secStep && secStep > 1) {
    const base = `every ${secStep} seconds`;
    const scope = betweenHours(cron);
    return scope ? `${base}, ${scope}` : base;
  }

  if (miOne !== null && hOne !== null && (secOne !== null || !q)) {
    const ss = q && secOne ? `:${pad(secOne)}` : '';
    return `at ${pad(hOne)}:${pad(miOne)}${ss}`;
  }
  if (miStep && h.wildcard) return `every ${miStep} minutes`;
  if (miOne !== null && h.wildcard) {
    return miOne === 0 ? 'at the top of every hour' : `at ${miOne} minutes past every hour`;
  }
  if (mi.wildcard && h.wildcard) return 'every minute';
  if (mi.wildcard && hRange) {
    return `every minute between ${pad(hRange.from)}:00 and ${pad(hRange.to)}:59`;
  }
  if (miStep && hRange) {
    return `every ${miStep} minutes between ${pad(hRange.from)}:00 and ${pad(hRange.to)}:59`;
  }
  if (miStep && hStep) {
    return `every ${miStep} minutes, every ${hStep} hours`;
  }
  if (miOne !== null && hStep) {
    return miOne === 0
      ? `every ${hStep} hours, on the hour`
      : `at ${miOne} minutes past every ${hStep} hours`;
  }
  if (mi.wildcard && hOne !== null) {
    return `every minute from ${pad(hOne)}:00 to ${pad(hOne)}:59`;
  }
  if (miStep && hOne !== null) {
    return `every ${miStep} minutes from ${pad(hOne)}:00 to ${pad(hOne)}:59`;
  }

  const miDesc = mi.wildcard
    ? 'every minute'
    : miStep
      ? `every ${miStep} minutes`
      : `at minute ${list(plainValues(mi).map(String))}`;
  const hDesc = h.wildcard
    ? 'every hour'
    : hStep
      ? `every ${hStep} hours`
      : `hour ${list(plainValues(h).map((v) => pad(v)))}`;
  return `${miDesc} past ${hDesc}`;
}

function betweenHours(cron: ParsedCron): string {
  const r = soleRange(cron.hour);
  if (r) return `between ${pad(r.from)}:00 and ${pad(r.to)}:59`;
  if (cron.hour.wildcard) return '';
  const one = single(cron.hour);
  if (one !== null) return `during the ${pad(one)}:00 hour`;
  return `in hours ${list(plainValues(cron.hour).map(pad))}`;
}

function dowPhrase(f: CronField): string {
  for (const tok of f.tokens) {
    if (tok.t === 'lastDow') return `the last ${DAYS[tok.day]} of the month`;
    if (tok.t === 'nthDow') return `the ${ordinal(tok.nth)} ${DAYS[tok.day]} of the month`;
  }
  const step = stepAll(f, 0, 6);
  if (step && step > 1) return `every ${step} days of the week`;
  const vals = plainValues(f);
  const key = vals.join(',');
  if (key === '1,2,3,4,5') return 'weekdays';
  if (key === '0,6') return 'weekends';
  const r = soleRange(f);
  if (r && !(r.from === 1 && r.to === 5)) return `${DAYS[r.from]} through ${DAYS[r.to]}`;
  return list(vals.map((v) => `${DAYS[v]}s`));
}

function domPhrase(f: CronField): string {
  for (const tok of f.tokens) {
    if (tok.t === 'lastDom') {
      return tok.offset === 0
        ? 'the last day of the month'
        : `${ordinal(tok.offset)}-to-last day of the month`;
    }
    if (tok.t === 'lastWeekday') return 'the last weekday of the month';
    if (tok.t === 'nearestWeekday') return `the weekday nearest the ${ordinal(tok.day)}`;
  }
  const step = stepAll(f, 1, 31);
  if (step && step > 1) return `every ${step} days`;
  const r = soleRange(f);
  if (r) return `the ${ordinal(r.from)} through the ${ordinal(r.to)}`;
  return `the ${list(plainValues(f).map(ordinal))}`;
}

function monthPhrase(f: CronField): string {
  if (f.wildcard) return '';
  const step = stepAll(f, 1, 12);
  if (step && step > 1) return `every ${step} months`;
  const r = soleRange(f);
  if (r) return `${MONTHS[r.from - 1]} through ${MONTHS[r.to - 1]}`;
  return list(plainValues(f).map((v) => MONTHS[v - 1]));
}

export function describe(cron: ParsedCron): Description {
  if (cron.reboot) {
    return { text: 'Runs once when the machine starts. This cannot be scheduled in advance.' };
  }

  const parts: string[] = [timePhrase(cron)];

  const domR = cron.dom.restricted;
  const dowR = cron.dow.restricted;
  let warning: string | undefined;

  if (domR && dowR && cron.dialect === 'standard') {
    parts.push(`on ${domPhrase(cron.dom)}, or on ${dowPhrase(cron.dow)}`);
    warning =
      'Day-of-month and day-of-week are both set. Standard cron treats this as OR — it runs on ' +
      'either match, not only when both line up. Use a shell guard if you need "both".';
  } else if (domR && !cron.dom.any) {
    parts.push(`on ${domPhrase(cron.dom)}`);
  } else if (dowR && !cron.dow.any) {
    parts.push(`on ${dowPhrase(cron.dow)}`);
  }

  const mp = monthPhrase(cron.month);
  if (mp) parts.push(`in ${mp}`);

  const text = parts.join(', ').replace(/^./, (c) => c.toUpperCase()) + '.';
  return { text, warning };
}
