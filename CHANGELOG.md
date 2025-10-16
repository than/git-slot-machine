# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
