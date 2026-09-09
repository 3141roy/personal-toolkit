import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'cron',
  name: 'Cron builder',
  category: 'dev',
  icon: 'calendar-clock',
  summary: 'Read a cron expression, or build one from a sentence.',
  accepts: ['text/plain'],
  produces: ['text/plain'],
  sharedFaq: false,
  seo: {
    title: 'Cron Expression Explainer & Builder - Bundle',
    description:
      'Paste a cron expression for a plain-English breakdown and its next run times, or build one from a sentence. Standard and Quartz, free, in your browser.',
  },
  faq: [
    {
      q: 'Which cron formats does it understand?',
      a: 'Standard 5-field crontab (Vixie/cronie) and 6-field Quartz (leading seconds, plus ?, L, W, and # specials). It auto-detects by field count and syntax; you can force either. Shortcuts like @daily and @reboot work too.',
    },
    {
      q: 'What is the warning about day-of-month and day-of-week?',
      a: 'When both are set in a standard cron, it runs on EITHER match, not only when they coincide. "0 0 1 * 2" fires on the 1st of every month AND every Tuesday. Getting "only a 1st that is a Tuesday" needs a shell guard, not one cron line.',
    },
    {
      q: 'Are the next run times in my timezone?',
      a: "Yes, your browser's local time (with UTC shown alongside). Cron itself has no timezone, it runs in whatever the machine is set to.",
    },
  ],
};

export default manifest;
