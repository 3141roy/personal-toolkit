import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'lorem-ipsum',
  name: 'Lorem ipsum generator',
  h1: 'Lorem ipsum generator',
  category: 'generate',
  icon: 'text-plus',
  summary:
    'Generate lorem ipsum placeholder text by paragraphs, sentences or words. Copy as plain text or HTML, made in your browser.',
  cardSummary: 'Placeholder text by paragraphs, sentences or words.',
  accepts: ['text/plain'],
  produces: ['text/plain', 'text/html'],
  sharedFaq: false,
  seo: {
    title: 'Lorem Ipsum Generator - Paragraphs, Sentences, Words - Bundle',
    description:
      'Generate lorem ipsum by paragraphs, sentences or words. Copy as plain text or HTML. Free, instant, made in your browser with nothing sent anywhere.',
  },
  guide: [
    {
      heading: 'What is lorem ipsum?',
      body: 'Lorem ipsum is scrambled Latin used as placeholder text. It comes from a passage in Cicero’s De Finibus, written in 45 BC. Designers use it because it looks like real text but has no meaning to distract from the layout. Most of it is not valid Latin once shuffled, so do not read too much into it.',
    },
    {
      heading: 'How to use this generator',
      body: 'Type how many you want and pick paragraphs, sentences or words. Leave "Start with Lorem ipsum" on for the familiar opening line, or turn it off for fully random text. For paragraphs you can wrap each one in p tags to paste straight into HTML. Hit New text for a fresh shuffle and Copy to grab it.',
    },
    {
      heading: 'Use real copy before launch',
      body: 'Lorem ipsum hides problems that real content exposes, such as long headings, short descriptions and empty states. Use it to get a layout started, then test with real text before launch. Paragraph lengths here vary on purpose, so your design sees uneven content.',
    },
  ],
  related: [
    { id: 'text-count', anchor: 'Count words and characters in your text' },
    { id: 'text-diff', anchor: 'Compare two versions of a text' },
  ],
  faq: [
    {
      q: 'Does it send anything anywhere?',
      a: 'No. The text is shuffled in your browser from a word list built into the page. Nothing is sent, logged or saved.',
    },
    {
      q: 'Why does it start with "Lorem ipsum dolor sit amet"?',
      a: 'That opening line is the standard, so designers recognise it as placeholder text at a glance. Turn the option off if you want random text from the first word.',
    },
    {
      q: 'Is lorem ipsum real Latin?',
      a: 'It is based on real Latin from Cicero, but the words are cut, reordered and mixed so it has no real meaning.',
    },
    {
      q: 'Can I get HTML output?',
      a: 'Yes. In paragraph mode, turn on "Wrap in <p> tags" and each paragraph comes out as a paragraph element, one per line, ready to paste into a page.',
    },
    {
      q: 'How much text can I generate?',
      a: 'Up to 50 paragraphs, 100 sentences or 1,000 words at a time. Generate again for more.',
    },
  ],
};

export default manifest;
