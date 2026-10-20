const NEEDLE = new TextEncoder().encode('/Encrypt');

export function looksEncrypted(bytes: Uint8Array): boolean {
  const decoder = new TextDecoder('latin1');
  let from = 0;

  for (;;) {
    const slash = bytes.indexOf(NEEDLE[0], from);
    if (slash === -1) return false;
    from = slash + 1;

    if (!NEEDLE.every((byte, i) => bytes[slash + i] === byte)) continue;

    const after = decoder.decode(bytes.subarray(slash + NEEDLE.length, slash + 40));
    if (/^\s*(\d+\s+\d+\s+R|<<)/.test(after)) return true;
  }
}
