export const POST_COMMIT_HOOK = `#!/bin/sh
# Git Slot Machine post-commit hook

# Get the commit hash
HASH=$(git rev-parse --short=7 HEAD)

# Check if git-slot-machine is installed
if command -v git-slot-machine >/dev/null 2>&1; then
  git-slot-machine play "$HASH" --small
elif [ -f "./node_modules/.bin/git-slot-machine" ]; then
  ./node_modules/.bin/git-slot-machine play "$HASH" --small
else
  echo "git-slot-machine not found, skipping animation"
fi
`;
