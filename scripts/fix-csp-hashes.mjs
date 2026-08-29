import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

function findHtmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findHtmlFiles(full, out);
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function hashScript(content) {
  return 'sha256-' + createHash('sha256').update(content, 'utf8').digest('base64');
}

const distDir = 'dist';
const scriptRe = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
const cspRe = /(<meta http-equiv="content-security-policy" content=")([^"]*)(")/;

let patched = 0;

for (const file of findHtmlFiles(distDir)) {
  let html = readFileSync(file, 'utf8');

  const neededHashes = new Set();
  let match;
  while ((match = scriptRe.exec(html))) {
    neededHashes.add(hashScript(match[1]));
  }
  if (neededHashes.size === 0) continue;

  const cspMatch = html.match(cspRe);
  if (!cspMatch) continue;

  const directives = cspMatch[2].split(';').map((d) => d.trim());
  const scriptSrcIndex = directives.findIndex((d) => d.startsWith('script-src'));
  if (scriptSrcIndex === -1) continue;

  const existing = new Set(directives[scriptSrcIndex].match(/'sha256-[^']+'/g) ?? []);
  let changed = false;
  for (const hash of neededHashes) {
    const quoted = `'${hash}'`;
    if (!existing.has(quoted)) {
      directives[scriptSrcIndex] += ` ${quoted}`;
      changed = true;
    }
  }

  if (changed) {
    html = html.replace(cspRe, `$1${directives.join('; ')}$3`);
    writeFileSync(file, html);
    patched++;
  }
}

console.log(`fix-csp-hashes: patched ${patched} file(s).`);
