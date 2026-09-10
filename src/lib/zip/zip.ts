import { zipSync, type Zippable } from 'fflate';

export type ZipEntry = { name: string; blob: Blob };

export function uniqueNames(entries: ZipEntry[]): ZipEntry[] {
  const seen = new Map<string, number>();
  return entries.map(({ name, blob }) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) return { name, blob };
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    return { name: `${stem}-${count + 1}${ext}`, blob };
  });
}

export async function makeZip(entries: ZipEntry[]): Promise<Blob> {
  const named = uniqueNames(entries);
  const data: Zippable = {};
  for (const { name, blob } of named) {
    data[name] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }];
  }
  return new Blob([zipSync(data)], { type: 'application/zip' });
}

export async function downloadZip(entries: ZipEntry[], zipName: string): Promise<void> {
  const url = URL.createObjectURL(await makeZip(entries));
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
