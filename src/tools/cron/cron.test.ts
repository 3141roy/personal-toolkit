import { describe, it, expect } from 'vitest';
import { parseCron, matchesAt, detectDialect } from './cron';
import { describe as explainCron } from './cronText';
import { nextRuns } from './cronSchedule';

function ok(expr: string, dialect?: 'standard' | 'quartz') {
  const r = parseCron(expr, dialect);
  if (!r.ok) throw new Error(`parse failed: ${r.error}`);
  return r.cron;
}

const text = (expr: string, dialect?: 'standard' | 'quartz') => explainCron(ok(expr, dialect)).text;

describe('detectDialect', () => {
  it('counts fields and looks for Quartz tokens', () => {
    expect(detectDialect('*/5 * * * *')).toBe('standard');
    expect(detectDialect('0 0 12 * * ?')).toBe('quartz');
    expect(detectDialect('0 0 L * *')).toBe('quartz');
  });
});

describe('parseCron - errors', () => {
  it('rejects the wrong field count', () => {
    expect(parseCron('* * * *')).toEqual({
      ok: false,
      error: 'Standard cron needs 5 fields, got 4.',
    });
  });
  it('rejects out-of-range values', () => {
    expect(parseCron('0 25 * * *')).toMatchObject({ ok: false });
    expect((parseCron('0 25 * * *') as { error: string }).error).toMatch(/hour: .*25/);
  });
  it('rejects "?" outside Quartz day fields', () => {
    expect(parseCron('? * * * *')).toMatchObject({ ok: false });
  });
  it('rejects Quartz with both day fields set', () => {
    expect(parseCron('0 0 12 1 * MON')).toMatchObject({ ok: false });
  });
  it('rejects unknown shortcuts', () => {
    expect(parseCron('@fortnightly')).toMatchObject({ ok: false });
  });
});

describe('parseCron - shortcuts', () => {
  it('expands @daily and friends', () => {
    expect(ok('@daily').source).toBe('0 0 * * *');
    expect(ok('@weekly').source).toBe('0 0 * * 0');
    expect(ok('@yearly').source).toBe('0 0 1 1 *');
  });
  it('flags @reboot', () => {
    expect(ok('@reboot').reboot).toBe(true);
    expect(nextRuns(ok('@reboot'), new Date(), 5)).toEqual([]);
  });
});

describe('explain - standard', () => {
  it('interval within an hour window on weekdays', () => {
    expect(text('*/15 9-17 * * 1-5')).toBe(
      'Every 15 minutes between 09:00 and 17:59, on weekdays.',
    );
  });
  it('a fixed daily time', () => {
    expect(text('30 6 * * *')).toBe('At 06:30.');
  });
  it('the top of every hour', () => {
    expect(text('0 * * * *')).toBe('At the top of every hour.');
  });
  it('every N hours on the hour', () => {
    expect(text('0 */6 * * *')).toBe('Every 6 hours, on the hour.');
  });
  it('named months and a nth weekday-less day list', () => {
    expect(text('0 12 1,15 JAN,JUL *')).toBe('At 12:00, on the 1st and 15th, in January and July.');
  });
  it('weekends', () => {
    expect(text('0 10 * * 0,6')).toBe('At 10:00, on weekends.');
  });
});

describe('explain - the day-of-month / day-of-week OR trap', () => {
  it('warns and phrases it as OR', () => {
    const d = explainCron(ok('0 0 1 * 2'));
    expect(d.text).toBe('At 00:00, on the 1st, or on Tuesdays.');
    expect(d.warning).toMatch(/OR/);
  });
  it('no warning when only one day field is set', () => {
    expect(explainCron(ok('0 0 1 * *')).warning).toBeUndefined();
    expect(explainCron(ok('0 0 * * 2')).warning).toBeUndefined();
  });
});

describe('explain - Quartz', () => {
  it('seconds, and the ? placeholder', () => {
    expect(text('*/30 * * * * ?')).toBe('Every 30 seconds.');
    expect(text('0 0 12 ? * MON-FRI')).toBe('At 12:00, on weekdays.');
    expect(text('0 0 12 ? * TUE-THU')).toBe('At 12:00, on Tuesday through Thursday.');
  });
  it('L, LW and #', () => {
    expect(text('0 0 0 L * ?')).toBe('At 00:00, on the last day of the month.');
    expect(text('0 0 0 LW * ?')).toBe('At 00:00, on the last weekday of the month.');
    expect(text('0 0 12 ? * 6L')).toBe('At 12:00, on the last Friday of the month.');
    expect(text('0 0 12 ? * MON#1')).toBe('At 12:00, on the 1st Monday of the month.');
    expect(text('0 0 12 15W * ?')).toBe('At 12:00, on the weekday nearest the 15th.');
  });
});

describe('matchesAt', () => {
  const at = (s: string) => new Date(s);
  it('matches a standard weekday interval', () => {
    const c = ok('*/15 9-17 * * 1-5');
    expect(matchesAt(c, at('2024-03-11T09:15:00'))).toBe(true); // Monday
    expect(matchesAt(c, at('2024-03-11T09:10:00'))).toBe(false);
    expect(matchesAt(c, at('2024-03-10T09:15:00'))).toBe(false); // Sunday
    expect(matchesAt(c, at('2024-03-11T18:00:00'))).toBe(false); // outside window
  });
  it('honours the OR of day-of-month and day-of-week', () => {
    const c = ok('0 0 1 * 2'); // 1st OR Tuesday
    expect(matchesAt(c, at('2024-05-01T00:00:00'))).toBe(true); // 1st (a Wednesday)
    expect(matchesAt(c, at('2024-05-07T00:00:00'))).toBe(true); // a Tuesday
    expect(matchesAt(c, at('2024-05-08T00:00:00'))).toBe(false);
  });
  it('standard cron only fires at second 0', () => {
    expect(matchesAt(ok('* * * * *'), at('2024-01-01T00:00:30'))).toBe(false);
  });
  it('Quartz L is the last day of the month', () => {
    const c = ok('0 0 0 L * ?');
    expect(matchesAt(c, at('2024-02-29T00:00:00'))).toBe(true); // leap year
    expect(matchesAt(c, at('2024-02-28T00:00:00'))).toBe(false);
  });
  it('Quartz nth weekday', () => {
    const c = ok('0 0 12 ? * MON#1');
    expect(matchesAt(c, at('2024-04-01T12:00:00'))).toBe(true); // 1st Monday
    expect(matchesAt(c, at('2024-04-08T12:00:00'))).toBe(false); // 2nd Monday
  });
});

describe('nextRuns', () => {
  const from = new Date('2024-03-11T08:00:00'); // a Monday
  it('lists the next daily fires', () => {
    const runs = nextRuns(ok('0 9 * * *'), from, 3);
    expect(runs.map((d) => [d.getDate(), d.getHours(), d.getMinutes()])).toEqual([
      [11, 9, 0],
      [12, 9, 0],
      [13, 9, 0],
    ]);
  });
  it('skips the weekend for a weekday cron', () => {
    const runs = nextRuns(ok('0 9 * * 1-5'), new Date('2024-03-15T10:00:00'), 2); // Friday after 9
    expect(runs.map((d) => d.getDay())).toEqual([1, 2]); // Mon, Tue
  });
  it('returns nothing for an impossible date', () => {
    expect(nextRuns(ok('0 0 30 2 *'), from, 5)).toEqual([]);
  });
  it('handles a Quartz every-30-seconds expression', () => {
    const runs = nextRuns(ok('*/30 * * * * ?'), new Date('2024-03-11T08:00:05'), 3);
    expect(runs.map((d) => [d.getMinutes(), d.getSeconds()])).toEqual([
      [0, 30],
      [1, 0],
      [1, 30],
    ]);
  });
});
