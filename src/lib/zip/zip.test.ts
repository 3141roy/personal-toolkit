import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { makeZip, uniqueNames } from './zip';

describe('uniqueNames', () => {
  it('disambiguates repeated names, keeping the extension', () => {
    const b = new Blob(['x']);
    const out = uniqueNames([
      { name: 'page.png', blob: b },
      { name: 'page.png', blob: b },
      { name: 'page.png', blob: b },
    ]);
    expect(out.map((e) => e.name)).toEqual(['page.png', 'page-2.png', 'page-3.png']);
  });
});

describe('makeZip', () => {
  it('round-trips file contents', async () => {
    const zip = await makeZip([
      { name: 'a.txt', blob: new Blob(['hello']) },
      { name: 'b.txt', blob: new Blob(['world']) },
    ]);
    const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()));
    expect(strFromU8(entries['a.txt'])).toBe('hello');
    expect(strFromU8(entries['b.txt'])).toBe('world');
  });
});
