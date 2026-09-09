import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'timestamp',
  name: 'Timestamp converter',
  category: 'dev',
  icon: 'clock',
  summary: 'A unix timestamp in any timezone, with a live countdown.',
  accepts: ['text/plain'],
  produces: ['text/plain'],
  sharedFaq: false,
  seo: {
    title: 'Unix Timestamp Converter with Timezones - Bundle',
    description:
      'Convert a unix timestamp (seconds or milliseconds) or ISO date to any timezone, with a live countdown. Free, in your browser, nothing sent anywhere.',
  },
  faq: [
    {
      q: 'Does it send anything anywhere?',
      a: 'No. It reads your browser clock and the timezone data already built into your browser. No network request, no logging, no account.',
    },
    {
      q: 'How does it tell seconds from milliseconds?',
      a: 'By size, not digit count. A whole number under 100,000,000,000 is read as seconds, larger as milliseconds. It also accepts ISO 8601 strings and anything the browser can parse as a date.',
    },
    {
      q: 'Where does the timezone list come from?',
      a: "The browser's own IANA database (Intl), around 400 zones. No library, no network request. A short list of common cities is always shown even on older browsers.",
    },
    {
      q: 'Does it handle daylight saving?',
      a: 'Yes for the displayed times, which come from the browser. The exact countdown (1y 2mo 3d ...) is computed in UTC so a DST change never adds or drops an hour from it.',
    },
  ],
};

export default manifest;
