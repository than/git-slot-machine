# Git Slot Machine Release Process

This is a multi-repo project with the CLI and website living in separate repositories. Both need to be updated when releasing.

## Repositories

- **CLI**: `/Users/thantibbetts/Sites/git-slot-machine/git-slot-machine`
- **Website**: `/Users/thantibbetts/Sites/git-slot-machine/gitslotmachine.com`

## Release Checklist

### 1. Update CLI CHANGELOG.md
- Add new version section at the top
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Categorize changes: Added, Changed, Fixed, Breaking Changes, etc.

### 2. Bump CLI Version
Update version in **both** files:
- `package.json` → `"version": "X.Y.Z"`
- `src/index.ts` → `.version('X.Y.Z', '-v, --version', ...)`

### 3. Build and Test
```bash
npm run build
# Test the built CLI if needed
node dist/index.js --help
```

### 4. Commit and Push CLI
```bash
git add CHANGELOG.md package.json src/index.ts
git commit -m "release: vX.Y.Z - brief description"
git push
```

### 5. Publish to npm
```bash
npm publish
```

### 6. Tag Git Release
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z: brief description"
git push origin vX.Y.Z
```

### 7. Update Website Changelog ⚠️ DON'T FORGET!
Navigate to website repo and update:
- `resources/views/livewire/changelog.blade.php`
- Add new version section in the CLI tab
- Match the format of existing entries
- Use appropriate emoji categories (🐛 Bug Fixes, ✨ New Features, ⚠️ Breaking Changes, 🎨 UI/UX)

### 8. Commit and Push Website
```bash
cd /Users/thantibbetts/Sites/git-slot-machine/gitslotmachine.com
git add resources/views/livewire/changelog.blade.php
git commit -m "docs: add CLI vX.Y.Z to website changelog"
git push
```

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR (X.0.0)**: Breaking changes
- **MINOR (0.X.0)**: New features (backwards compatible)
- **PATCH (0.0.X)**: Bug fixes and small improvements

## Notes

- Always use TodoWrite to track release progress
- The website changelog is CRITICAL - users see this first
- Test commands after building before publishing
- npm publish is irreversible - double check version numbers
