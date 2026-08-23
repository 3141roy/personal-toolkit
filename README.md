# Bundle

**Tools that stay on your device.**

A privacy-first web toolkit — PDF, image, and dev tools that run entirely in the browser.
No uploads, no server, no accounts, no analytics. Every file operation happens on your
machine; a strict Content-Security-Policy enforces that at the browser level, not just as
a promise — `connect-src 'self'` means the site is physically unable to phone home.

**[bundle.tools](https://bundle.tools)**

[![CI](https://github.com/3141roy/personal-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/3141roy/personal-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Tools

**PDF**

- Compress PDF — shrink a PDF's file size
- Markdown to PDF — turn a markdown file into a PDF

**Image**

- Resize — shrink or enlarge, in px or %
- Compress — shrink file size
- Convert — between PNG, JPEG, and WebP
- Crop — trim down to a region
- Rounded crop — circle/square crop for profile pictures
- Rotate & flip
- Metadata — see and clear what's hiding in a photo's EXIF data
- HEIC to JPG — turn an iPhone photo into a regular JPG
- Bulk — resize, compress, or convert many images at once

**Dev**

- JSON format — format, minify, or validate, with a tree view

More on the way — see `CONTRIBUTING.md` if you want to add one.

## Stack

Astro (static shell) · Svelte islands (interactive tools) · plain CSS tokens · TypeScript ·
Web Workers + WebAssembly for heavy work (image codecs, PDF compression) · self-hosted
fonts. Deployed on Cloudflare Pages.

## Running locally

```
git clone https://github.com/3141roy/personal-toolkit.git
cd personal-toolkit
npm install
npm run dev
```

Requires Node `>=22.12.0`.

```
npm run build      # production build
npm test             # unit + real-browser tests
npm run typecheck     # astro check
npm run lint            # prettier --check .
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — project layout, how to add a tool, commit and PR
conventions, and how preview deploys work.

## License

[MIT](LICENSE) © 3141Roy
