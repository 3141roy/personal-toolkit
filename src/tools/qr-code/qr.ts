import { encode } from 'uqr';

export type Ecc = 'L' | 'M' | 'Q' | 'H';
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export type QrInput =
  | { kind: 'link'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'wifi'; ssid: string; password: string; security: WifiSecurity; hidden: boolean }
  | {
      kind: 'contact';
      firstName: string;
      lastName: string;
      org: string;
      title: string;
      phone: string;
      email: string;
      website: string;
      address: string;
    }
  | { kind: 'email'; to: string; subject: string; body: string }
  | { kind: 'phone'; number: string };

export type MissingField = 'url' | 'text' | 'ssid' | 'password' | 'name' | 'to' | 'number' | null;

export interface Qr {
  size: number;
  version: number;
  data: boolean[][];
}

export interface RenderOptions {
  fg: string;
  bg: string | null;
  quiet: number;
  px?: number;
}

const SCHEME = /^([a-z][a-z0-9+.-]*:\/\/|mailto:|tel:|sms:)/i;

export function normaliseUrl(raw: string): string {
  const v = raw.trim();
  if (!v || SCHEME.test(v) || /\s/.test(v)) return v;
  return `https://${v}`;
}

function escapeWifi(v: string): string {
  return v.replace(/([\\;,:"])/g, '\\$1');
}

function escapeVcard(v: string): string {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/([;,])/g, '\\$1');
}

export function check(input: QrInput): MissingField {
  switch (input.kind) {
    case 'link':
      return input.url.trim() ? null : 'url';
    case 'text':
      return input.text.trim() ? null : 'text';
    case 'wifi':
      if (!input.ssid.trim()) return 'ssid';
      if (input.security !== 'nopass' && !input.password) return 'password';
      return null;
    case 'contact':
      return input.firstName.trim() || input.lastName.trim() || input.org.trim() ? null : 'name';
    case 'email':
      return input.to.trim() ? null : 'to';
    case 'phone':
      return input.number.replace(/[^\d+]/g, '') ? null : 'number';
  }
}

export function buildPayload(input: QrInput): string {
  if (check(input)) return '';
  switch (input.kind) {
    case 'link':
      return normaliseUrl(input.url);
    case 'text':
      return input.text;
    case 'wifi': {
      const parts = [`T:${input.security}`, `S:${escapeWifi(input.ssid.trim())}`];
      if (input.security !== 'nopass') parts.push(`P:${escapeWifi(input.password)}`);
      if (input.hidden) parts.push('H:true');
      return `WIFI:${parts.join(';')};;`;
    }
    case 'contact': {
      const first = input.firstName.trim();
      const last = input.lastName.trim();
      const full = [first, last].filter(Boolean).join(' ') || input.org.trim();
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escapeVcard(last)};${escapeVcard(first)};;;`,
        `FN:${escapeVcard(full)}`,
      ];
      const optional: [string, string][] = [
        ['ORG', input.org],
        ['TITLE', input.title],
        ['TEL;TYPE=CELL', input.phone],
        ['EMAIL', input.email],
        ['URL', input.website],
      ];
      for (const [key, value] of optional) {
        if (value.trim()) lines.push(`${key}:${escapeVcard(value.trim())}`);
      }
      if (input.address.trim()) lines.push(`ADR:;;${escapeVcard(input.address.trim())};;;;`);
      lines.push('END:VCARD');
      return lines.join('\r\n');
    }
    case 'email': {
      const query = [
        input.subject.trim() && `subject=${encodeURIComponent(input.subject.trim())}`,
        input.body.trim() && `body=${encodeURIComponent(input.body.trim())}`,
      ].filter(Boolean);
      return `mailto:${input.to.trim()}${query.length ? `?${query.join('&')}` : ''}`;
    }
    case 'phone':
      return `tel:${input.number.replace(/[^\d+]/g, '')}`;
  }
}

export function makeQr(payload: string, ecc: Ecc): Qr | null {
  if (!payload) return null;
  try {
    const r = encode(payload, { ecc, border: 0 });
    return { size: r.size, version: r.version, data: r.data };
  } catch {
    return null;
  }
}

export function renderSvg(qr: Qr, { fg, bg, quiet, px }: RenderOptions): string {
  const dim = qr.size + quiet * 2;
  let path = '';
  for (let y = 0; y < qr.size; y++) {
    let x = 0;
    while (x < qr.size) {
      if (!qr.data[y][x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < qr.size && qr.data[y][end]) end++;
      path += `M${x + quiet} ${y + quiet}h${end - x}v1h-${end - x}z`;
      x = end;
    }
  }
  const size = px ? ` width="${px}" height="${px}"` : '';
  const bgRect = bg ? `<rect width="${dim}" height="${dim}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}"${size} shape-rendering="crispEdges" role="img" aria-label="QR code">${bgRect}<path fill="${fg}" d="${path}"/></svg>`;
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function colourWarning(fg: string, bg: string): 'inverted' | 'low' | null {
  if (luminance(fg) > luminance(bg)) return 'inverted';
  return contrastRatio(fg, bg) < 3 ? 'low' : null;
}
