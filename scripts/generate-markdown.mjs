import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

function stripTags(html) {
  return html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractParagraphs(html) {
  return [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gs)].map((m) => stripTags(m[1])).filter(Boolean);
}

function extractToolCards(html) {
  const cardRe =
    /<a class="tool-card" href="([^"]+)"[^>]*>\s*<h3[^>]*>(.*?)<\/h3>\s*<div class="tool-desc"[^>]*>(.*?)<\/div>/gs;
  return [...html.matchAll(cardRe)].map(
    (m) => `- [${stripTags(m[2])}](${m[1]}): ${stripTags(m[3])}`,
  );
}

function extractMarkdown(html) {
  const lines = [];

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';

  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1];
  lines.push(`# ${stripTags(h1 ?? title)}`);
  if (description) lines.push('', description);

  const introMatch = html.match(/<h1[^>]*>.*?<\/h1>\s*<p[^>]*>(.*?)<\/p>/s);
  const introText = introMatch ? stripTags(introMatch[1]) : '';
  if (introText && !description.startsWith(introText)) lines.push('', introText);

  const sectionRe = /<section[^>]*>[\s\S]*?<h2[^>]*>(.*?)<\/h2>([\s\S]*?)<\/section>/g;
  let match;
  let sectionCount = 0;
  while ((match = sectionRe.exec(html))) {
    sectionCount++;
    lines.push('', `## ${stripTags(match[1])}`);
    for (const p of extractParagraphs(match[2])) lines.push('', p);
    for (const card of extractToolCards(match[2])) lines.push(card);
  }

  if (sectionCount === 0) {
    for (const card of extractToolCards(html)) lines.push(card);
  }

  const detailsRe = /<details[^>]*>\s*<summary[^>]*>(.*?)<\/summary>([\s\S]*?)<\/details>/g;
  while ((match = detailsRe.exec(html))) {
    lines.push('', `## ${stripTags(match[1])}`);
    for (const p of extractParagraphs(match[2])) lines.push('', p);
  }

  return (
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

const distDir = 'dist';
let count = 0;

for (const file of findHtmlFiles(distDir)) {
  const html = readFileSync(file, 'utf8');
  const markdown = extractMarkdown(html);
  writeFileSync(file.replace(/\.html$/, '.md'), markdown);
  count++;
}

console.log(`generate-markdown: wrote ${count} .md file(s).`);
