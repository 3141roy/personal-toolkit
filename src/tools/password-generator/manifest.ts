import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'password-generator',
  name: 'Password generator',
  h1: 'Random password and passphrase generator',
  category: 'generate',
  icon: 'key',
  summary:
    'Make a strong random password or an easy-to-type passphrase. It is generated in your browser and never stored or sent anywhere.',
  cardSummary: 'Strong random passwords or easy-to-type passphrases.',
  accepts: ['text/plain'],
  produces: ['text/plain'],
  sharedFaq: false,
  seo: {
    title: 'Password Generator - Random, Passphrase, Private - Bundle',
    description:
      'Generate a strong random password or passphrase with a strength meter. Made in your browser with secure randomness, never stored, logged or sent anywhere.',
  },
  guide: [
    {
      heading: 'How this password generator works',
      body: 'Every character is picked with crypto.getRandomValues, the secure random source built into your browser, not Math.random. Picks are unbiased, so no character is more likely than another. The password is made and shown on your device. It is never stored, logged or sent, so there is nothing to leak.',
    },
    {
      heading: 'How long should a password be?',
      body: 'Length matters more than fancy symbols. With all four character types, 16 characters gives about 98 bits of randomness, which is strong against any realistic attack. For a password manager master password, go to 20 or more. Use a unique password for every account.',
    },
    {
      heading: 'Password or passphrase?',
      body: 'A passphrase strings together random words, like a dash-separated set of five. It is easier to type and remember, and five words from a 2048-word list give 55 bits. Use six or more for important accounts. Use a random password for anything a password manager fills in for you.',
    },
  ],
  related: [{ id: 'qr-code', anchor: 'Share a Wi-Fi password as a QR code' }],
  faq: [
    {
      q: 'Is it safe to generate a password in a browser?',
      a: 'Yes, when it runs locally. This one does: the password is made on your device with the browser’s secure random generator and never sent anywhere. You can check the network tab, it stays empty.',
    },
    {
      q: 'Do you store or log the passwords?',
      a: 'No. Nothing is saved, not on a server and not in your browser. Close the tab and the password is gone, so copy it into your password manager first.',
    },
    {
      q: 'What is entropy, and what is a good number?',
      a: 'Entropy measures how unpredictable a password is, in bits. Each extra bit doubles the guesses needed. Aim for 80 or more for normal accounts and 100 or more for anything important.',
    },
    {
      q: 'How does the crack-time estimate work?',
      a: 'It assumes an attacker with a stolen password database guessing 10 billion times a second, and takes the average time to hit the right one. It is a rough guide, since real attackers vary and sites that limit guesses are much safer.',
    },
    {
      q: 'Why skip look-alike characters?',
      a: 'I, l, 1, O, 0 and o are easy to confuse when you read a password aloud or type it from paper. Skipping them makes it easier to copy by hand and costs very little strength.',
    },
  ],
};

export default manifest;
