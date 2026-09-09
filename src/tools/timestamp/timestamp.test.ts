import { describe, it, expect } from 'vitest';
import {
  parseInput,
  exactDelta,
  formatDelta,
  relativePhrase,
  offsetLabel,
  isValidZone,
  zoneList,
} from './timestamp';

describe('parseInput', () => {
  it('treats blank input as now', () => {
    expect(parseInput('   ')).toEqual({ kind: 'now' });
  });

  it('reads a 10-digit integer as unix seconds', () => {
    expect(parseInput('1700000000')).toEqual({
      kind: 'fixed',
      epochMs: 1700000000000,
      unit: 's',
    });
  });

  it('reads a 13-digit integer as unix milliseconds', () => {
    expect(parseInput('1700000000000')).toEqual({
      kind: 'fixed',
      epochMs: 1700000000000,
      unit: 'ms',
    });
  });

  it('splits seconds from milliseconds on magnitude, not digit count', () => {
    expect(parseInput('0')).toEqual({ kind: 'fixed', epochMs: 0, unit: 's' });
    expect(parseInput('99999999999')).toMatchObject({ unit: 's' });
    expect(parseInput('100000000000')).toMatchObject({ unit: 'ms' });
  });

  it('parses an ISO 8601 string', () => {
    expect(parseInput('2023-11-14T22:13:20Z')).toEqual({
      kind: 'fixed',
      epochMs: 1700000000000,
      unit: 'iso',
    });
  });

  it('rejects nonsense, unsafe integers, and out-of-range epochs', () => {
    expect(parseInput('not a date')).toEqual({ kind: 'error' });
    expect(parseInput('999999999999999999999')).toEqual({ kind: 'error' });
    expect(parseInput('9000000000000000')).toEqual({ kind: 'error' });
  });
});

describe('exactDelta / formatDelta', () => {
  const at = (iso: string) => Date.parse(iso);

  it('is all zeroes for the same instant', () => {
    const t = at('2024-01-01T00:00:00Z');
    expect(formatDelta(exactDelta(t, t))).toBe('00:00:00 from now');
  });

  it('breaks a past gap into calendar fields', () => {
    const d = exactDelta(at('2022-10-29T20:00:00Z'), at('2024-01-01T00:00:00Z'));
    expect(d).toMatchObject({ past: true, years: 1, months: 2, days: 2, hours: 4 });
    expect(formatDelta(d)).toBe('1y 2mo 2d 04:00:00 ago');
  });

  it('borrows across month, day, and minute boundaries', () => {
    const d = exactDelta(at('2024-03-01T00:00:30Z'), at('2024-02-29T23:59:00Z'));
    expect(d).toMatchObject({ past: false, years: 0, months: 0, days: 0, minutes: 1, seconds: 30 });
  });

  it('drops leading zero groups but always keeps the clock', () => {
    expect(formatDelta(exactDelta(at('2024-01-01T00:00:05Z'), at('2024-01-01T00:00:00Z')))).toBe(
      '00:00:05 from now',
    );
  });
});

describe('relativePhrase', () => {
  const now = Date.parse('2024-01-01T00:00:00Z');
  it('picks the largest fitting unit', () => {
    expect(relativePhrase(now - 90 * 1000, now)).toBe('1 minute ago');
    expect(relativePhrase(now + 3 * 3600 * 1000, now)).toBe('in 3 hours');
    expect(relativePhrase(now - 400 * 86400 * 1000, now)).toBe('last year');
  });
});

describe('offsetLabel', () => {
  const d = new Date('2024-01-15T12:00:00Z');
  it('formats the UTC offset for a zone', () => {
    expect(offsetLabel('UTC', d)).toBe('UTC+00:00');
    expect(offsetLabel('Asia/Kolkata', d)).toBe('UTC+05:30');
    expect(offsetLabel('America/New_York', d)).toBe('UTC-05:00');
  });
});

describe('isValidZone / zoneList', () => {
  it('accepts real zones and rejects junk', () => {
    expect(isValidZone('Asia/Tokyo')).toBe(true);
    expect(isValidZone('Middle/Earth')).toBe(false);
  });

  it('always includes the common cities with no duplicates', () => {
    const list = zoneList();
    expect(list).toContain('Asia/Kolkata');
    expect(list).toContain('UTC');
    expect(new Set(list).size).toBe(list.length);
  });
});
