import { describe, it, expect } from 'vitest';
import {
  buildPayload,
  check,
  colourWarning,
  contrastRatio,
  makeQr,
  normaliseUrl,
  renderSvg,
  type QrInput,
} from './qr';

const wifi = (over: Partial<Extract<QrInput, { kind: 'wifi' }>> = {}): QrInput => ({
  kind: 'wifi',
  ssid: 'Home',
  password: 'secret',
  security: 'WPA',
  hidden: false,
  ...over,
});

const contact = (over: Partial<Extract<QrInput, { kind: 'contact' }>> = {}): QrInput => ({
  kind: 'contact',
  firstName: 'Ada',
  lastName: 'Lovelace',
  org: '',
  title: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  ...over,
});

describe('normaliseUrl', () => {
  it('adds https only when there is no scheme', () => {
    expect(normaliseUrl('bundle.tools')).toBe('https://bundle.tools');
    expect(normaliseUrl(' http://a.b ')).toBe('http://a.b');
    expect(normaliseUrl('mailto:a@b.c')).toBe('mailto:a@b.c');
  });

  it('leaves free text with spaces alone', () => {
    expect(normaliseUrl('hello world')).toBe('hello world');
  });
});

describe('wifi payload', () => {
  it('builds the standard string', () => {
    expect(buildPayload(wifi())).toBe('WIFI:T:WPA;S:Home;P:secret;;');
  });

  it('escapes special characters', () => {
    expect(buildPayload(wifi({ ssid: 'a;b:c', password: 'p"w,\\' }))).toBe(
      'WIFI:T:WPA;S:a\\;b\\:c;P:p\\"w\\,\\\\;;',
    );
  });

  it('drops the password for open networks and flags hidden ones', () => {
    expect(buildPayload(wifi({ security: 'nopass', password: '', hidden: true }))).toBe(
      'WIFI:T:nopass;S:Home;H:true;;',
    );
  });

  it('asks for a password unless the network is open', () => {
    expect(check(wifi({ password: '' }))).toBe('password');
    expect(check(wifi({ ssid: ' ' }))).toBe('ssid');
    expect(check(wifi({ security: 'nopass', password: '' }))).toBeNull();
    expect(buildPayload(wifi({ password: '' }))).toBe('');
  });
});

describe('contact payload', () => {
  it('builds a vCard 3.0 with CRLF lines', () => {
    const out = buildPayload(contact({ phone: '+1 555 0100', email: 'ada@x.io' }));
    expect(out.split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Lovelace;Ada;;;',
      'FN:Ada Lovelace',
      'TEL;TYPE=CELL:+1 555 0100',
      'EMAIL:ada@x.io',
      'END:VCARD',
    ]);
  });

  it('escapes commas, semicolons and newlines', () => {
    const out = buildPayload(contact({ org: 'A, B; C', address: 'L1\nL2' }));
    expect(out).toContain('ORG:A\\, B\\; C');
    expect(out).toContain('ADR:;;L1\\nL2;;;;');
  });

  it('needs a name or organisation', () => {
    expect(check(contact({ firstName: '', lastName: '' }))).toBe('name');
    expect(check(contact({ firstName: '', lastName: '', org: 'Acme' }))).toBeNull();
  });
});

describe('email and phone payloads', () => {
  it('encodes mailto parameters', () => {
    expect(buildPayload({ kind: 'email', to: 'a@b.c', subject: 'Hi there', body: 'a&b' })).toBe(
      'mailto:a@b.c?subject=Hi%20there&body=a%26b',
    );
    expect(buildPayload({ kind: 'email', to: 'a@b.c', subject: '', body: '' })).toBe(
      'mailto:a@b.c',
    );
  });

  it('keeps only digits and a leading plus in tel', () => {
    expect(buildPayload({ kind: 'phone', number: '+44 (0)20-7946 0000' })).toBe(
      'tel:+4402079460000',
    );
  });
});

describe('makeQr', () => {
  it('returns a version 1 21x21 grid for short text with finder patterns', () => {
    const qr = makeQr('HELLO', 'M');
    expect(qr?.version).toBe(1);
    expect(qr?.size).toBe(21);
    expect(qr!.data[0].slice(0, 7).every(Boolean)).toBe(true);
    expect(qr!.data[0].slice(14, 21).every(Boolean)).toBe(true);
    expect(qr!.data[14].slice(0, 7).every(Boolean)).toBe(true);
  });

  it('returns null for empty or oversized input', () => {
    expect(makeQr('', 'L')).toBeNull();
    expect(makeQr('x'.repeat(4000), 'L')).toBeNull();
  });

  it('grows the version as ecc rises', () => {
    const text = 'https://bundle.tools/generate/qr-code';
    expect(makeQr(text, 'H')!.version).toBeGreaterThan(makeQr(text, 'L')!.version);
  });
});

describe('renderSvg', () => {
  const qr = makeQr('HELLO', 'L')!;

  it('sizes the viewBox with the quiet zone and paints colours', () => {
    const svg = renderSvg(qr, { fg: '#000000', bg: '#ffffff', quiet: 4 });
    expect(svg).toContain('viewBox="0 0 29 29"');
    expect(svg).toContain('<rect width="29" height="29" fill="#ffffff"/>');
    expect(svg).toContain('fill="#000000"');
  });

  it('omits the background when transparent and sets width when asked', () => {
    const svg = renderSvg(qr, { fg: '#000000', bg: null, quiet: 4, px: 512 });
    expect(svg).not.toContain('<rect');
    expect(svg).toContain('width="512" height="512"');
  });

  it('draws exactly the dark modules', () => {
    const svg = renderSvg(qr, { fg: '#000', bg: null, quiet: 0 });
    const d = /d="([^"]*)"/.exec(svg)![1];
    const area = [...d.matchAll(/h(\d+)v1/g)].reduce((n, m) => n + Number(m[1]), 0);
    expect(area).toBe(qr.data.flat().filter(Boolean).length);
  });
});

describe('colour checks', () => {
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('warns on inverted and low contrast, passes dark on light', () => {
    expect(colourWarning('#ffffff', '#000000')).toBe('inverted');
    expect(colourWarning('#999999', '#aaaaaa')).toBe('low');
    expect(colourWarning('#283b49', '#f4efe4')).toBeNull();
  });
});
