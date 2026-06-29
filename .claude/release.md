# Git Slot Machine Release Process

Multi-repo project: the **CLI** (this repo, npm package `git-slot-machine`) and the **website**
(`gitslotmachine.com`, Laravel app) must be released together — the client and server both
compute pattern results, so they have to stay in lockstep.

## Repositories

- **CLI**: this repo (`git-slot-machine/`) — published to npm.
- **Website**: the `gitslotmachine.com/` repo (sibling directory) — Laravel app + odds page + API.

---

## A. Standard release checklist

### 1. Update CLI `CHANGELOG.md`
- Add a new version section at the top, [Keep a Changelog](https://keepachangelog.com/) format.
- Categorize: Added / Changed / Fixed / Breaking.

### 2. Bump the CLI version
- Edit **`package.json` → `"version"` ONLY.**
- There is **no other string to change** — `--version` reads the version from `package.json` at
  runtime (`src/index.ts`: `const { version } = require('../package.json')`). (The old hardcoded
  `.version('X.Y.Z')` string was removed in 2.4.0.)

### 3. Build and test
```bash
pnpm build          # tsc → dist/
pnpm test           # jest
node dist/index.js --help
```

### 4. Commit and push the CLI
```bash
git add CHANGELOG.md package.json
git commit -m "release: vX.Y.Z - brief description"
git push
```

### 5. Publish to npm
```bash
npm publish         # irreversible — double-check the version first
```

### 6. Tag the release
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z: brief description"
git push origin vX.Y.Z
```

### 7. Update the website ⚠️ DON'T FORGET
In the `gitslotmachine.com` repo:
- **Changelog**: `resources/views/livewire/changelog.blade.php` — add a section in the CLI tab
  (and the WEB APP tab if the site itself changed). Emoji categories: ✨ New Features,
  🐛 Bug Fixes, ⚠️ Breaking Changes, 🎨 UI/UX.
- **Site version strings**: `resources/views/components/terminal-layout.blade.php` —
  the `<meta name="app-version" content="X.Y.Z">` tag (drives the "new version" banner) and the
  displayed `git-slot-machine vX.Y.Z` chrome string.

### 8. Commit and push the website
```bash
git add resources/views/livewire/changelog.blade.php resources/views/components/terminal-layout.blade.php
git commit -m "docs: add vX.Y.Z to website changelog + bump app version"
git push
```

---

## B. Ruleset / payout changes (the odds) — EXTRA steps

Payouts and odds live in the **canonical `patterns.json`** — the single source of truth, kept
**identical** in both repos:
- `git-slot-machine/src/patterns.json`
- `gitslotmachine.com/resources/data/patterns.json`

**Never hand-edit the payout numbers in code.** The PHP detector loads them from the JSON at
runtime; the TS in-code `PAYOUTS` table mirrors it and is guarded by a contract test.

1. **Regenerate** `patterns.json` (the generator enumerates all 16⁷ hashes so the `net`/`oneIn`
   odds are exact). Copy the regenerated file into **both** repos.
2. **Verify the math**: `pnpm verify:odds` (CLI) — enumerates all 16⁷ = 268,435,456 hashes and
   asserts every per-pattern net count + the RTP against `patterns.json`.
3. **Run both test suites** — the shared golden-vector fixture guarantees the TS, PHP, and
   browser detectors all agree:
   - CLI: `pnpm test`
   - Website: `php artisan test`
4. The `rulesetHash` in `patterns.json` updates automatically; bump `rulesetVersion` for a
   human-facing number.
5. If the TS `PAYOUTS` drifts from the JSON, `patterns.contract.test.ts` fails — update
   `src/patterns.ts` to match.
6. **Do NOT deploy one side without the other** — if the client and server disagree, wins won't
   verify. Ship the CLI and website together.
7. Clients detect a stale payout table at runtime via `GET /api/ruleset-version` (hash + version
   handshake). See `gitslotmachine.com/docs/PATTERN-DETECTION-SPEC.md` § Sync Protocol for the
   full algorithm and the tricky-rule reference.

---

## Version Guidelines

[Semantic Versioning](https://semver.org/):
- **MAJOR (X.0.0)**: breaking changes — *a payout/odds change qualifies* (it changes the economy).
  The v3 payout overhaul shipped as `3.0.0`.
- **MINOR (0.X.0)**: new features, backwards compatible.
- **PATCH (0.0.X)**: bug fixes and small improvements.

## Notes

- The website changelog is what users see first — don't skip it.
- `npm publish` is irreversible — double-check the version.
- The CLI runs inside a post-commit hook: keep it fast and offline-tolerant (never block a commit
  on a network call).
