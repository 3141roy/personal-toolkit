export type Dialect = 'standard' | 'quartz';

export type FieldToken =
  | { t: 'all' }
  | { t: 'any' }
  | { t: 'value'; v: number }
  | { t: 'range'; from: number; to: number }
  | { t: 'step'; from: number; to: number; step: number }
  | { t: 'lastDom'; offset: number }
  | { t: 'lastWeekday' }
  | { t: 'nearestWeekday'; day: number }
  | { t: 'lastDow'; day: number }
  | { t: 'nthDow'; day: number; nth: number };

export interface CronField {
  raw: string;
  tokens: FieldToken[];
  values: Set<number>;
  wildcard: boolean;
  any: boolean;
  restricted: boolean;
}

export interface ParsedCron {
  dialect: Dialect;
  reboot: boolean;
  source: string;
  second: CronField;
  minute: CronField;
  hour: CronField;
  dom: CronField;
  month: CronField;
  dow: CronField;
}

export type ParseResult = { ok: true; cron: ParsedCron } | { ok: false; error: string };

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const SHORTCUTS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

interface Spec {
  name: string;
  min: number;
  max: number;
  names?: string[];
  nameBase?: number;
}

export function detectDialect(expr: string): Dialect {
  const parts = expr.trim().split(/\s+/);
  if (parts.length >= 6) return 'quartz';
  if (/(^|\s)[^\s]*[?#]|[0-9]?L|[0-9]W/i.test(expr)) return 'quartz';
  return 'standard';
}

export function parseCron(input: string, dialect?: Dialect): ParseResult {
  let expr = input.trim().replace(/\s+/g, ' ');
  if (!expr) return { ok: false, error: 'Empty expression.' };

  if (expr.toLowerCase() === '@reboot') {
    return { ok: true, cron: { ...emptyCron('standard'), reboot: true, source: '@reboot' } };
  }
  if (expr.startsWith('@')) {
    const mapped = SHORTCUTS[expr.toLowerCase()];
    if (!mapped) return { ok: false, error: `Unknown shortcut "${expr}".` };
    expr = mapped;
  }

  const parts = expr.split(' ');
  const d: Dialect = dialect ?? detectDialect(expr);

  let fields: string[];
  if (d === 'quartz') {
    if (parts.length === 5) fields = ['0', ...parts];
    else if (parts.length === 6) fields = parts;
    else if (parts.length === 7) fields = parts.slice(0, 6);
    else return { ok: false, error: `Quartz cron needs 6 fields, got ${parts.length}.` };
  } else {
    if (parts.length !== 5)
      return { ok: false, error: `Standard cron needs 5 fields, got ${parts.length}.` };
    fields = ['0', ...parts];
  }

  const dowSpec: Spec =
    d === 'quartz'
      ? { name: 'day-of-week', min: 1, max: 7, names: DAYS, nameBase: 1 }
      : { name: 'day-of-week', min: 0, max: 7, names: DAYS, nameBase: 0 };

  const specs: Spec[] = [
    { name: 'second', min: 0, max: 59 },
    { name: 'minute', min: 0, max: 59 },
    { name: 'hour', min: 0, max: 23 },
    { name: 'day-of-month', min: 1, max: 31 },
    { name: 'month', min: 1, max: 12, names: MONTHS, nameBase: 1 },
    dowSpec,
  ];

  const parsed: CronField[] = [];
  for (let i = 0; i < 6; i++) {
    const r = parseField(fields[i], specs[i], d);
    if (!r.ok) return { ok: false, error: `${specs[i].name}: ${r.error}` };
    parsed.push(r.field);
  }

  const [second, minute, hour, dom, month, dow] = parsed;

  if (d === 'quartz' && !dom.any && !dow.any && !dom.wildcard && !dow.wildcard) {
    return {
      ok: false,
      error: 'Quartz needs "?" in either day-of-month or day-of-week when the other is set.',
    };
  }

  // normalise dow to canonical 0-6 (0 = Sunday)
  const canonDow = canonicaliseDow(dow, d);

  return {
    ok: true,
    cron: {
      dialect: d,
      reboot: false,
      source: fields.slice(d === 'quartz' ? 0 : 1).join(' '),
      second,
      minute,
      hour,
      dom,
      month,
      dow: canonDow,
    },
  };
}

function emptyCron(dialect: Dialect): ParsedCron {
  const f = (): CronField => ({
    raw: '*',
    tokens: [{ t: 'all' }],
    values: new Set(),
    wildcard: true,
    any: false,
    restricted: false,
  });
  return {
    dialect,
    reboot: false,
    source: '',
    second: f(),
    minute: f(),
    hour: f(),
    dom: f(),
    month: f(),
    dow: f(),
  };
}

function canonicaliseDow(field: CronField, dialect: Dialect): CronField {
  const shift = (v: number): number => {
    if (dialect === 'quartz') return (v - 1 + 7) % 7 === 7 ? 0 : (v - 1) % 7;
    return v === 7 ? 0 : v;
  };
  const values = new Set<number>();
  for (const v of field.values) values.add(shift(v));
  const tokens = field.tokens.map((tok): FieldToken => {
    if (tok.t === 'value') return { t: 'value', v: shift(tok.v) };
    if (tok.t === 'range') return { t: 'range', from: shift(tok.from), to: shift(tok.to) };
    if (tok.t === 'step')
      return { t: 'step', from: shift(tok.from), to: shift(tok.to), step: tok.step };
    if (tok.t === 'lastDow') return { t: 'lastDow', day: shift(tok.day) };
    if (tok.t === 'nthDow') return { t: 'nthDow', day: shift(tok.day), nth: tok.nth };
    return tok;
  });
  return { ...field, values, tokens };
}

function parseField(
  raw: string,
  spec: Spec,
  dialect: Dialect,
): { ok: true; field: CronField } | { ok: false; error: string } {
  const mk = (over: Partial<CronField>): { ok: true; field: CronField } => ({
    ok: true,
    field: {
      raw,
      tokens: [],
      values: new Set(),
      wildcard: false,
      any: false,
      restricted: true,
      ...over,
    },
  });

  if (raw === '*') return mk({ tokens: [{ t: 'all' }], wildcard: true, restricted: false });
  if (raw === '?') {
    if (dialect !== 'quartz' || (spec.name !== 'day-of-month' && spec.name !== 'day-of-week')) {
      return { ok: false, error: '"?" is only valid for day fields in Quartz.' };
    }
    return mk({ tokens: [{ t: 'any' }], any: true, restricted: false });
  }

  const tokens: FieldToken[] = [];
  const values = new Set<number>();
  const isDom = spec.name === 'day-of-month';
  const isDow = spec.name === 'day-of-week';

  for (const part of raw.split(',')) {
    const p = part.trim();
    if (!p) return { ok: false, error: `empty term in "${raw}".` };

    if (dialect === 'quartz' && isDom) {
      if (p === 'L') {
        tokens.push({ t: 'lastDom', offset: 0 });
        continue;
      }
      if (p === 'LW') {
        tokens.push({ t: 'lastWeekday' });
        continue;
      }
      const lm = /^L-(\d+)$/.exec(p);
      if (lm) {
        tokens.push({ t: 'lastDom', offset: Number(lm[1]) });
        continue;
      }
      const wm = /^(\d+)W$/.exec(p);
      if (wm) {
        const day = Number(wm[1]);
        if (day < 1 || day > 31) return { ok: false, error: `"${p}" day out of range.` };
        tokens.push({ t: 'nearestWeekday', day });
        continue;
      }
    }
    if (dialect === 'quartz' && isDow) {
      const lm = /^(\d+|[A-Z]{3})L$/.exec(p);
      if (lm) {
        const day = resolveName(lm[1], spec);
        if (day === null) return { ok: false, error: `"${p}" is not a valid day.` };
        tokens.push({ t: 'lastDow', day });
        continue;
      }
      const hm = /^(\d+|[A-Z]{3})#([1-5])$/.exec(p);
      if (hm) {
        const day = resolveName(hm[1], spec);
        if (day === null) return { ok: false, error: `"${p}" is not a valid day.` };
        tokens.push({ t: 'nthDow', day, nth: Number(hm[2]) });
        continue;
      }
    }

    const stepM = /^(.+)\/(\d+)$/.exec(p);
    const base = stepM ? stepM[1] : p;
    const step = stepM ? Number(stepM[2]) : 1;
    if (stepM && step < 1) return { ok: false, error: `step must be 1 or more in "${p}".` };

    let from: number;
    let to: number;
    if (base === '*') {
      from = spec.min;
      to = spec.max;
    } else {
      const rangeM = /^(\d+|[A-Z]{3})(?:-(\d+|[A-Z]{3}))?$/.exec(base);
      if (!rangeM) return { ok: false, error: `"${p}" is not understood.` };
      const a = resolveName(rangeM[1], spec);
      if (a === null) return { ok: false, error: `"${rangeM[1]}" is not valid here.` };
      if (rangeM[2] === undefined) {
        if (!inRange(a, spec))
          return { ok: false, error: `${a} is out of range ${spec.min}–${spec.max}.` };
        if (step === 1) {
          tokens.push({ t: 'value', v: a });
          values.add(a);
          continue;
        }
        from = a;
        to = spec.max;
      } else {
        const b = resolveName(rangeM[2], spec);
        if (b === null) return { ok: false, error: `"${rangeM[2]}" is not valid here.` };
        from = a;
        to = b;
      }
    }

    if (!inRange(from, spec) || !inRange(to, spec)) {
      return { ok: false, error: `range ${from}–${to} is outside ${spec.min}–${spec.max}.` };
    }

    const seq: number[] = [];
    if (from <= to) {
      for (let v = from; v <= to; v++) seq.push(v);
    } else {
      for (let v = from; v <= spec.max; v++) seq.push(v);
      for (let v = spec.min; v <= to; v++) seq.push(v);
    }
    let added = 0;
    for (let k = 0; k < seq.length; k += step) {
      values.add(seq[k]);
      added++;
    }
    if (stepM || base === '*') tokens.push({ t: 'step', from, to, step });
    else tokens.push({ t: 'range', from, to });
    if (added === 0) return { ok: false, error: `"${p}" matches nothing.` };
  }

  return mk({ tokens, values });
}

function resolveName(token: string, spec: Spec): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  if (!spec.names) return null;
  const idx = spec.names.indexOf(token.toUpperCase());
  return idx === -1 ? null : idx + (spec.nameBase ?? 0);
}

function inRange(v: number, spec: Spec): boolean {
  return Number.isInteger(v) && v >= spec.min && v <= spec.max;
}

function lastDomOf(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

function domFieldMatches(field: CronField, date: Date): boolean {
  if (field.wildcard || field.any) return true;
  const day = date.getDate();
  const y = date.getFullYear();
  const m = date.getMonth();
  const dow = date.getDay();
  for (const tok of field.tokens) {
    if (tok.t === 'value' && tok.v === day) return true;
    if (tok.t === 'range' && withinWrap(day, tok.from, tok.to)) return true;
    if (tok.t === 'step' && stepMatch(day, tok)) return true;
    if (tok.t === 'lastDom' && day === lastDomOf(y, m) - tok.offset) return true;
    if (tok.t === 'lastWeekday') {
      const last = lastDomOf(y, m);
      let target = last;
      const wd = new Date(y, m, last).getDay();
      if (wd === 0) target = last - 2;
      else if (wd === 6) target = last - 1;
      if (day === target) return true;
    }
    if (tok.t === 'nearestWeekday') {
      if (nearestWeekday(y, m, tok.day) === day && dow !== 0 && dow !== 6) return true;
    }
  }
  return false;
}

function nearestWeekday(year: number, month0: number, day: number): number {
  const last = lastDomOf(year, month0);
  const target = Math.min(day, last);
  const wd = new Date(year, month0, target).getDay();
  if (wd === 6) return target === 1 ? target + 2 : target - 1;
  if (wd === 0) return target === last ? target - 2 : target + 1;
  return target;
}

function dowFieldMatches(field: CronField, date: Date): boolean {
  if (field.wildcard || field.any) return true;
  const dow = date.getDay();
  const day = date.getDate();
  const y = date.getFullYear();
  const m = date.getMonth();
  for (const tok of field.tokens) {
    if (tok.t === 'value' && tok.v === dow) return true;
    if (tok.t === 'range' && withinWrap(dow, tok.from, tok.to)) return true;
    if (tok.t === 'step' && stepMatch(dow, tok)) return true;
    if (tok.t === 'lastDow' && dow === tok.day && day + 7 > lastDomOf(y, m)) return true;
    if (tok.t === 'nthDow' && dow === tok.day && Math.ceil(day / 7) === tok.nth) return true;
  }
  return false;
}

function withinWrap(v: number, from: number, to: number): boolean {
  return from <= to ? v >= from && v <= to : v >= from || v <= to;
}

function stepMatch(v: number, tok: { from: number; to: number; step: number }): boolean {
  if (!withinWrap(v, tok.from, tok.to)) return false;
  const span = tok.from <= tok.to ? v - tok.from : (v - tok.from + 60) % 60;
  return span % tok.step === 0;
}

function simpleMatch(field: CronField, v: number): boolean {
  return field.wildcard || field.any || field.values.has(v);
}

export function dayMatches(cron: ParsedCron, date: Date): boolean {
  if (cron.reboot) return false;
  if (!simpleMatch(cron.month, date.getMonth() + 1)) return false;

  const domR = cron.dom.restricted;
  const dowR = cron.dow.restricted;
  const domOk = domFieldMatches(cron.dom, date);
  const dowOk = dowFieldMatches(cron.dow, date);

  if (cron.dialect === 'quartz') {
    if (cron.dom.any) return dowOk;
    if (cron.dow.any) return domOk;
    if (!domR && !dowR) return true;
    return domR ? domOk : dowOk;
  }
  if (domR && dowR) return domOk || dowOk;
  if (domR) return domOk;
  if (dowR) return dowOk;
  return true;
}

export function matchesAt(cron: ParsedCron, date: Date): boolean {
  if (cron.reboot) return false;
  if (cron.dialect === 'quartz' && !simpleMatch(cron.second, date.getSeconds())) return false;
  if (cron.dialect === 'standard' && date.getSeconds() !== 0) return false;
  if (!simpleMatch(cron.minute, date.getMinutes())) return false;
  if (!simpleMatch(cron.hour, date.getHours())) return false;
  return dayMatches(cron, date);
}

export function fieldValues(field: CronField, min: number, max: number): number[] {
  if (field.wildcard || field.any) {
    const out: number[] = [];
    for (let v = min; v <= max; v++) out.push(v);
    return out;
  }
  return [...field.values].sort((a, b) => a - b);
}
