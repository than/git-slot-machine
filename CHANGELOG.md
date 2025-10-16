# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
