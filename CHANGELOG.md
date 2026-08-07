# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-08-06

### Changed

- **`sync:disable` now silences only the current repo.** It previously wrote the global config, silencing every repo at once. `sync:disable --global` restores the old behavior. This is the intended fix, but it will surprise anyone who relied on the old default.
- Every setting is now settable at either scope. `sync:enable`/`sync:disable` and `privacy:on`/`privacy:off` default to this repo, `username:set` and `config:set api-url` default to global, and each accepts `--global`/`--repo`. All of them name the scope they wrote ("globally" / "for this repo"); `whoami` names the file.
- `privateRepo` resolves through the merged config, so a global `privateRepo: true` means "default all my repos to private". No existing config sets it globally, so this is a no-op on upgrade.
- `api-url` stays global-only and rejects `--repo` — `getApiUrl()` reads global config only so a repo can't redirect an authenticated sync, which would make a per-repo value silently inert.
- `whoami` marks which scope owns each setting, names the global value when a repo overrides it, and prints the path of both config files — worth having now that repo config resolves to the *common* git dir, which in a worktree is not the `.git` next to you.

### Added

- **`git-slot-machine privacy:on` / `privacy:off`** — privacy mode was previously only settable during `init`, so re-running `init` was the only way to change it.
- `config:get`/`config:set` accept `private-repo`.

### Fixed

- **`init` asks who gets credit in private repos.** The org-credit prompt was suppressed under privacy mode, so a private org repo could only be credited to its org by hand-editing `.git/slot-machine-config.json`. Privacy hides the repo name; the username is sent either way.
- `init` reads the real git remote for its visibility check and credit prompt. With privacy mode already on, it was reading the obfuscated `private/private` — querying `api.github.com/repos/private/private` and offering to credit an org named "private".
- The per-repo identity override and the global identity are one key (`githubUsername`) resolved through the normal merge, replacing the `playAsUsername` special case. Existing repo configs are migrated on first read, idempotently and without a write when there is nothing to migrate.
- Repo-scoped writes outside a git repository report "not a git repository" instead of an `ENOENT` stack.
- **Repo config resolves the repository's common git directory** instead of assuming `cwd/.git`. It was only readable from the repo root of an ordinary checkout, so with repo now the default scope a repo with sync disabled would sync from a subdirectory, and a private repo would send its real name. In a worktree or submodule `.git` is a *file*, where the write failed with `ENOTDIR`. Linked worktrees share one repo config, matching where their hooks live.
- `init` installs the post-commit hook into the common git directory, so it works from a subdirectory and inside a worktree instead of throwing `ENOENT`/`ENOTDIR` after already prompting for and saving the privacy answer.
- **`login <name>` no longer adopts a per-repo identity as the global one.** "Adopt when nothing is established yet" was safe while `init` was the only writer of a per-repo override, since it sets the global identity first. `username:set <name> --repo` writes only the repo config, so on a machine that had never run `init`, following the login hint made the org the identity for every other repo.
- **`config:set` rejects unrecognized boolean values** instead of coercing them to false — `private-repo yes` used to turn privacy *off*.
- `init` resolves the git directory before its first prompt, so a failure there can't leave a saved privacy answer with no hook, and its errors print like every other command's instead of an unhandled-rejection stack.
- **`username:set <name> --repo` warns when no token is held for that name.** Plays resolve their token through the repo-scoped identity, so pointing a repo at an identity you haven't logged in as made every commit's sync fail — silently, because `play` swallows sync errors and its "not authenticated" notice is off in `--small`, the post-commit hook's only mode.
- **`init` asks who gets credit whenever a per-repo override exists**, not only when the repo owner differs from the personal username. `username:set <name> --repo` (new here) can point any repo at any name, so `than/my-app` overridden to `broomfitters` skipped the question entirely — leaving plays credited to `broomfitters` while `init` authenticated as `than`. The prompt now lists the override as its own option.
- `init` no longer claims "✓ Public repository confirmed" when privacy mode is already on, and says whether privacy came from this repo or the global default. It seeds privacy state from the config, so a re-run skips the visibility check and the closing summary reports what is actually sent.

## [3.1.1] - 2026-08-06

### Added

- **`git-slot-machine logout --all`** — revokes every identity's token on the server and clears the revoked ones locally; tokens that couldn't be revoked are kept so a re-run can finish the job
- Logout reports when a token could not be revoked server-side (tokens never expire there) instead of claiming success; re-authenticating best-effort revokes the token it replaces

### Fixed

- **`login <name>` and re-running `init` no longer hijack the global identity.** `login` only adopts a name globally when no identity is established yet or it matches the established one (`username:set` is the deliberate change); `init` resolves the personal identity from the global config, and choosing personal credit now actually clears an existing per-repo override
- Token keys are lowercased on write and lookup (GitHub usernames are case-insensitive); mixed-case keys written by 3.1.0 are normalized on first read so their tokens keep resolving
- `config get all` reads token state through the per-identity lookup instead of the removed legacy field
- Unauthenticated/no-remote notices no longer fire in `--small` mode, preserving the post-commit hook's single-line output
- Global config is written `0600` in a `0700` directory (both self-heal on save) — it holds bearer tokens
- A failed migration write-back no longer blanks a valid on-disk config; an unattributable legacy token is preserved rather than deleted
- `whoami` shows the per-repo override even when no GitHub remote parses; `status` hints name the real `login` command
- `apiUrl` is read from the global config only, so a repo-local file can't redirect authenticated syncs

## [3.1.0] - 2026-07-29

### Added

- **Per-identity API tokens** — tokens are stored in an `apiTokens` map keyed by GitHub username; the pre-3.1 single `apiToken` is migrated automatically on first read
- **`git-slot-machine whoami`** — shows the global identity, this repo's effective identity and per-repo override, privacy mode, held tokens, and sync state

### Fixed

- **Org logins via `init` no longer hijack the global identity.** `init` keeps `githubUsername` personal and stores the org in the repo's `playAsUsername`

### Changed

- `vendor/` is gitignored; `composer.json`/`composer.lock` are tracked for the enumeration tooling

## [3.0.0] - 2026-06-27

### Changed

- **Payout ruleset v3** — every payout rebalanced against exact, enumerated odds (all 16⁷
  hashes). Payouts now follow true rarity monotonically, with intentional themed bonuses
  (ALL NUMBERS rides rich, straights run a touch hot). RTP ≈ 109%.

  | Pattern | v2 | v3 |
  |---|--:|--:|
  | JACKPOT | 100,000 | 250,000 |
  | LUCKY SEVEN | 50,000 | 100,000 |
  | BIG STRAIGHT | 25,000 | 50,000 |
  | HEXTET | 10,000 | 25,000 |
  | FULLEST HOUSE | 5,000 | 10,000 |
  | STRAIGHT | 2,500 | 5,000 |
  | FIVE OF A KIND | 2,000 | 2,500 |
  | THREE PAIR | 500 | 1,000 |
  | DOUBLE TRIPLE | 1,000 | 750 |
  | ALPHABET SOUP | 250 | 500 |
  | FULLER HOUSE | 400 | 250 |
  | FOUR OF A KIND | 200 | 100 |
  | TWO PAIR | 25 | 50 |
  | ALL NUMBERS | 50 | 30 |
  | FULL HOUSE | 50 | 25 |

  Unchanged: THREE OF A KIND 25 · ONE PAIR 10.
- Payouts are now sourced from a canonical `patterns.json` shared with the web app
  (single source of truth); the in-code table is guarded by a contract test.

### Fixed

- Corrected the published odds, which were materially wrong for several patterns
  (e.g. STRAIGHT is ~2.4× more common, and ALL NUMBERS ~13× more common, than previously stated).

### Added

- `getRulesetVersion()` client + the server `GET /api/ruleset-version` handshake, so the CLI
  can detect when its bundled payout table has drifted from the server's.
- `scripts/verify-odds.mjs` — exhaustively enumerates all 16⁷ hashes and asserts every payout/odds.

## [2.4.0] - 2026-03-11

### Fixed

- Skip slot machine animation in non-interactive environments (`CLAUDECODE=1`, `CI=1`)
  - Animation skip is now built into the CLI itself — no hook changes needed
  - Game still plays, balance updates, and API syncs normally
  - Works automatically in all repos on upgrade
- `--version` flag now reads from `package.json` instead of a hardcoded string
- Removed `.claude/` config and source files from published npm package

### Changed

- Added `files` field to `package.json` — package size reduced from 57KB to 24KB (58% smaller)

## [2.3.1] - 2026-03-11

### Fixed

- Post-commit hook now suppresses animation frames when running under Claude Code (`CLAUDECODE=1`)
  - Game still plays, balance updates, and API syncs normally
  - Only the final result line is shown, saving LLM context tokens
  - Normal terminal usage is completely unchanged

## [2.3.0] - 2025-12-17

### Added

- ???

## [2.2.0] - 2025-10-23

### Added

- **Hash grinding detection** - Detects and flags suspicious commit amending behavior
  - Checks git reflog for commit amend patterns
  - Flags commits with 5+ amends in a 5-minute window
  - Sends suspicious activity flag and amend count to API
  - Displays warning to users when suspicious activity is detected
- **API: Suspicious activity tracking** - Tracks hash grinding attempts
  - New `suspicious` and `amend_count` columns in plays table
  - Stores and tracks flagged commits for review
- **Artisan command: `play:remove`** - Safely remove plays and recalculate stats
  - Removes specific plays by commit hash and username
  - Recalculates all repository and user statistics
  - Uses database transactions for safety
- **Artisan command: `plays:suspicious`** - View flagged commits
  - Lists all plays flagged for hash grinding
  - Shows statistics and top offenders
  - Filter by user with `--user` option
  - Limit results with `--limit` option

### Security

- Prevents hash grinding exploitation by detecting and flagging suspicious amend patterns
- All admin functions are terminal-based (secure for public repositories)

## [2.1.6] - 2025-10-17

### Added

- Web app: Update notification banner

## [2.1.5] - 2025-10-17

### Fixed

- API: Fixed streak timestamp not updating on new records

## [2.1.4] - 2025-10-17

### Fixed

- Web stats: Fixed pattern display names and probabilities in theory vs reality table

## [2.1.3] - 2025-10-17

### Changed

- Web stats: Added flip cards to overview with new metrics (plays per day, expected win rate, payouts per day, net per play)

## [2.1.2] - 2025-10-17

### Changed

- Web stats: Improved theory vs reality table readability with increased precision

## [2.1.1] - 2025-10-17

### Fixed

- Fixed ONE PAIR pattern highlighting in web odds table (JavaScript patterns.js)

## [2.1.0] - 2025-10-17

### Added

- **ONE PAIR pattern** - New break-even pattern at +10 points
  - Exactly one consecutive pair (e.g., `aa1b3d5`)
  - Occurs in ~14% of commits (~1 in 7)
  - Replaces the old break-even pattern

### Changed

- **ALL NUMBERS payout increased**: 10 → 50 points
  - Pattern now properly rewarded for its rarity (1 in 485)
  - Break-even role moved to ONE PAIR
- Pattern detection priority updated to check ONE PAIR after ALL NUMBERS

## [2.0.0] - 2025-10-17

### Breaking Changes

- **Complete payout rebalancing** based on actual probabilities
- Patterns now ordered by rarity (rarest first)
- Top-tier payouts massively increased:
  - JACKPOT: 10K → 100K
  - LUCKY SEVEN: 2.5K → 50K
  - BIG STRAIGHT: 500 → 25K
- Mid-tier balanced:
  - HEXTET: 5K → 10K
  - FULLEST HOUSE: 2K → 5K
  - STRAIGHT: 200 → 2.5K
  - FIVE OF A KIND: 1K → 2K
- Common patterns remain profitable:
  - THREE OF A KIND: 50 → 100
  - TWO PAIR: 50 → 25
  - ALL NUMBERS: 10 (unchanged, break-even)

### Changed

- Payout curve now properly reflects mathematical probabilities
- Rare patterns properly rewarded relative to their actual odds

## [1.3.2] - 2025-01-16

### Added

- **Organization vs personal credit choice** during `init` command
  - Choose whether commits should be credited to your personal username or the repo's organization
  - Per-repo configuration stored locally in `.git/slot-machine-config.json`
  - Prompt only appears when repo owner differs from your personal username
  - Perfect for company repos (credit the org) or personal projects (credit yourself)

### Changed

- `getGitHubUsername()` now checks for per-repo override before falling back to global username
- Added `playAsUsername` field to config interface for per-repo identity

### Improved

- More flexible identity management for developers working across personal and organizational repos
- Each repository can have its own credit preferences

## [1.3.1] - 2025-01-16

### Changed

- Hidden `config:get` and `config:set` from default help output (dev/advanced only)
- Updated `init` command to show new `sync:disable` command instead of old syntax

### Improved

- Cleaner help output focusing on user-facing commands
- Advanced commands still available but don't clutter common workflows

## [1.3.0] - 2025-01-16

### Changed

- **Simplified command structure**: Adopted Laravel/Artisan-style `resource:action` pattern
  - `git-slot-machine config set sync-enabled false` → `git-slot-machine sync:disable`
  - `git-slot-machine config set sync-enabled true` → `git-slot-machine sync:enable`
  - Added `git-slot-machine username:set <username>` for easier username changes
  - Kept `config:get` and `config:set` for advanced configuration

### Improved

- More intuitive command structure following industry-standard patterns
- Shorter, more memorable commands for common operations
- Better command discoverability with resource-based organization

## [1.2.4] - 2025-01-16

### Fixed

- Fixed `init` command to continue setup even when post-commit hook already exists
- Now completes username setup, privacy mode, and leaderboard opt-in when hook exists
- Shows instructions for manually integrating with existing hooks instead of aborting

## [1.2.3] - 2025-01-16

### Fixed

- Fixed postinstall script dependency issue - now uses ANSI codes instead of chalk
- Postinstall message now displays correctly on global install

## [1.2.2] - 2025-01-16

### Fixed

- Fixed postinstall script not showing on global install
- Removed overly strict global install detection that prevented message from displaying

## [1.2.1] - 2025-01-16

### Fixed

- Added `-v` shorthand for `--version` flag
- Updated hardcoded version from 0.1.0 to 1.2.1

## [1.2.0] - 2025-01-16

### Breaking Changes

- **Simplified command structure**: Authentication commands moved to top-level
  - `git-slot-machine auth login <username>` → `git-slot-machine login <username>`
  - `git-slot-machine auth status` → `git-slot-machine status`
  - `git-slot-machine auth logout` → `git-slot-machine logout`

### Added

- **Automatic GitHub username detection** during init with smart fallback chain:
  - GitHub CLI (`gh`) authentication
  - Git config `github.user`
  - GitHub noreply email pattern
  - Manual prompt as fallback
- **Opt-in leaderboard prompt** during init - users choose whether to join
- **Postinstall script** with setup instructions (global installs only)

### Changed

- GitHub username now stored globally (not per-repo) as it represents developer identity
- Init flow now prompts to join leaderboard with username confirmation
- Authentication is now optional but encouraged during setup

### Improved

- Clearer onboarding experience with guided prompts
- Better username detection reduces manual entry
- More intuitive command structure (no nested `auth` subcommand)

## [1.1.2] - 2025-01-16

### Improved

- Enhanced privacy mode messaging with visual indicators (✓ and ✗) to clearly show what data is and isn't sent to the server
- Privacy mode now displays a red X for repository details that are NOT sent
- Public mode shows all items with green checkmarks
- Added explanatory note for privacy mode showing that repo details are sent as "private/private"

## [1.1.1] - 2025-01-16

### Fixed

- Fixed ES Module compatibility issue with chalk v5+ by converting from CommonJS to ES Modules
- Added explicit `.js` file extensions to all relative imports as required by ES modules
- Updated TypeScript configuration to compile to ES2022 modules instead of CommonJS
- Added `"type": "module"` to package.json

### Changed

- Module system: CommonJS → ES Modules (ESM)
- TypeScript compiler target now outputs ES2022 modules
- All import statements now include explicit `.js` extensions

## [1.1.0] - Previous Release

### Added

- Global leaderboards and win tracking
- Authentication with GitHub username
- Balance syncing across repositories
- Win streak tracking
- Multiple gameplay modes (animated and compact)

### Features

- Automatic post-commit hook installation
- Offline mode with sync when available
- Configuration management
- Pattern detection for commit hashes
- Shareable win URLs
