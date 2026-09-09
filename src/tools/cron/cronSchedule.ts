import { dayMatches, fieldValues, type ParsedCron } from './cron';

export function nextRuns(cron: ParsedCron, from: Date, count: number): Date[] {
  if (cron.reboot || count < 1) return [];

  const seconds = cron.dialect === 'quartz' ? fieldValues(cron.second, 0, 59) : [0];
  const minutes = fieldValues(cron.minute, 0, 59);
  const hours = fieldValues(cron.hour, 0, 23);

  const limit = new Date(from);
  limit.setFullYear(limit.getFullYear() + 5);

  const out: Date[] = [];
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  while (day.getTime() <= limit.getTime() && out.length < count) {
    if (dayMatches(cron, day)) {
      for (const h of hours) {
        for (const mi of minutes) {
          for (const s of seconds) {
            const cand = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi, s);
            if (cand.getTime() > from.getTime()) out.push(cand);
          }
        }
      }
    }
    day.setDate(day.getDate() + 1);
  }

  return out.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
}
