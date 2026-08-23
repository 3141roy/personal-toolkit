# Contributing

Thanks for looking at this. It's a small, personal, privacy-first web toolkit — every file
operation runs entirely in the browser, nothing gets uploaded, no accounts, no analytics.
If a change you're proposing needs a server or sends data anywhere, it doesn't belong here.

## Setup

```
git clone https://github.com/3141roy/personal-toolkit.git
cd personal-toolkit
npm install
npm run dev
```

Requires Node `>=22.12.0` (see `engines` in `package.json`).

## Before you open a PR

```
npm run lint        # prettier --check .
npm run typecheck    # astro check
npm test              # vitest run (unit + real-browser tests via Playwright)
npm run build          # astro build
```

All four run in CI on every PR (`.github/workflows/ci.yml`) and are required to merge.
Playwright's browser tests need Chromium installed once: `npx playwright install --with-deps chromium`.

Fix formatting automatically with `npm run fix` instead of hand-editing whitespace.

## Project shape

Astro static shell + Svelte islands for the interactive bits + plain CSS tokens + Web
Workers for anything heavy (image/PDF processing). Every tool lives in its own folder under
`src/tools/`, same shape every time:

```
<tool-id>/
├─ manifest.ts          the tool's ID card — category, accepted file types, icon
├─ <Name>.svelte         the UI, built from src/shell/ components (Dropzone, States, ...)
├─ <name>.ts               pure logic: one function, no DOM, no Svelte — unit-tested
├─ <name>.worker.ts        runs the logic off the main thread (heavy tools only)
├─ copy.ts                  every user-facing string
└─ <name>.test.ts          a test for the pure logic
```

`src/tools/registry.ts` auto-discovers every tool via `import.meta.glob` — adding a tool
never means editing a central list, home page, or router. Copy `src/tools/_template/` to
start a new one.

## Adding a tool — definition of done

1. `manifest.ts` complete
2. pure logic (`<name>.ts`) + a passing test
3. a worker (`<name>.worker.ts`) if the work is heavy — image/PDF/wasm
4. every user-facing string in `copy.ts`, never inline in the `.svelte` file
5. empty / working / done / **error** states all handled (`src/shell/States.svelte`)
6. `<VerifyNote />` renders with the output — it's the "check this before you rely on it"
   disclaimer every tool shows; free via `<States>`, import it yourself if the tool builds
   its own result UI (see `src/tools/bulk/` or `src/tools/json-format/` for examples)
7. mobile verified
8. network tab stays empty — this is the whole point of the project

## Voice, briefly

Copy sounds like one person who built this because they were tired of sketchy upload
buttons — plain, a little wry, first-person, never corporate. No exclamation marks, no
generic strings ("Processing…", "Success!", "Error"). Say what happened, what to do next,
and why it's still fine (nothing left your device). Look at an existing tool's `copy.ts` for
the actual tone before writing new copy — it's easier to match than to describe.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) — `feat: add pdf merge`,
`fix: worker hangs on empty file`, `docs: ...`, `chore: ...`. Releases are cut automatically
by `release-please` from these prefixes (`feat` → minor, `fix` → patch, `!` or
`BREAKING CHANGE:` → major), so an inaccurate prefix produces a wrong version bump.

## Pull requests

- Branch off `main`, PR back into `main`. Direct pushes to `main` are blocked.
- CI (lint/typecheck/test/build) must pass before merge.
- Someone with write access reviews and merges — there's no auto-merge.
- Add the `preview` label to get a live preview deploy on Cloudflare Pages (see below);
  don't add it to a PR you haven't read yet, since labeling causes that code to actually
  build and run on a public preview URL.

## Preview deploys

Adding the `preview` label to a PR (`.github/workflows/preview.yml`) mirrors its head
commit to a `preview/pr-<number>` branch, which Cloudflare's Git integration is scoped to
build automatically. New commits update it while the label stays on; removing the label or
closing the PR deletes the branch and the preview with it. This works for fork PRs too, but
only a maintainer can apply the label — that's the gate, not the fork boundary itself.

## Releases

Handled by `release-please` (`.github/workflows/release.yml`): merged commits accumulate
into an open "chore: release x.y.z" PR with a generated changelog; merging that PR bumps
`package.json`, tags the release, and publishes the GitHub Release. Nothing is published
to npm — `version` is a release label, not a package version.

## Privacy is non-negotiable

No `fetch`/`XHR`/`WebSocket` calls that leave the origin, no analytics, no third-party
scripts, no new external font/CDN dependency. A strict Content-Security-Policy
(`astro.config.mjs`, `security.csp`) enforces this at the browser level, not just as a
promise — `connect-src 'self'` means the browser itself blocks any attempt to phone home.
If a change needs to talk to a server, it's the wrong tool for this project.

## Style

- No comments in code — self-documenting names, or explain in the PR description instead.
- No em dashes in copy or prose.
- Copy lives in `copy.ts`, never inline in a `.svelte` file.
- Match the surrounding code's idiom rather than introducing a new pattern for one file.

## Questions

Open an issue, or email `report@bundle.tools`.
