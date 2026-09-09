export type Parsed =
  | { kind: 'now' }
  | { kind: 'fixed'; epochMs: number; unit: 's' | 'ms' | 'iso' }
  | { kind: 'error' };

export function parseInput(raw: string): Parsed {
  const s = raw.trim();
  if (!s) return { kind: 'now' };
  if (/^-?\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isSafeInteger(n)) return { kind: 'error' };
    const [epochMs, unit] = Math.abs(n) < 1e11 ? [n * 1000, 's' as const] : [n, 'ms' as const];
    return Number.isNaN(new Date(epochMs).getTime())
      ? { kind: 'error' }
      : { kind: 'fixed', epochMs, unit };
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? { kind: 'error' } : { kind: 'fixed', epochMs: t, unit: 'iso' };
}

export interface Delta {
  past: boolean;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function exactDelta(target: number, now: number): Delta {
  const past = target < now;
  const lo = new Date(Math.min(target, now));
  const hi = new Date(Math.max(target, now));
  let years = hi.getUTCFullYear() - lo.getUTCFullYear();
  let months = hi.getUTCMonth() - lo.getUTCMonth();
  let days = hi.getUTCDate() - lo.getUTCDate();
  let hours = hi.getUTCHours() - lo.getUTCHours();
  let minutes = hi.getUTCMinutes() - lo.getUTCMinutes();
  let seconds = hi.getUTCSeconds() - lo.getUTCSeconds();
  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    days += new Date(Date.UTC(hi.getUTCFullYear(), hi.getUTCMonth(), 0)).getUTCDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }
  return { past, years, months, days, hours, minutes, seconds };
}

export function formatDelta(d: Delta): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const head: string[] = [];
  if (d.years) head.push(`${d.years}y`);
  if (d.months || d.years) head.push(`${d.months}mo`);
  if (d.days || d.months || d.years) head.push(`${d.days}d`);
  const clock = `${pad(d.hours)}:${pad(d.minutes)}:${pad(d.seconds)}`;
  return `${[...head, clock].join(' ')} ${d.past ? 'ago' : 'from now'}`;
}

const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

export function relativePhrase(target: number, now: number): string {
  const diff = (target - now) / 1000;
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs || unit === 'second') {
      return RTF.format(Math.round(diff / secs), unit);
    }
  }
  return 'now';
}

export function offsetLabel(timeZone: string, date: Date): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName');
  const raw = (part?.value ?? 'GMT').replace('GMT', 'UTC');
  return raw === 'UTC' ? 'UTC+00:00' : raw;
}

export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const COMMON = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export function zoneList(): string[] {
  const native =
    typeof (Intl as { supportedValuesOf?: unknown }).supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [];
  return [...new Set([...COMMON, ...native])];
}

export function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function defaultZones(): string[] {
  return [...new Set([localZone(), 'UTC', 'America/New_York', 'America/Los_Angeles'])];
}
