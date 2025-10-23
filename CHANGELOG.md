# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
