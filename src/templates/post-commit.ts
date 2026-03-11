export const POST_COMMIT_HOOK = `#!/bin/sh
# Git Slot Machine post-commit hook

# Get the commit hash
HASH=$(git rev-parse --short=7 HEAD)

# Find git-slot-machine binary
if command -v git-slot-machine >/dev/null 2>&1; then
  GSM=git-slot-machine
elif [ -f "./node_modules/.bin/git-slot-machine" ]; then
  GSM=./node_modules/.bin/git-slot-machine
else
  echo "git-slot-machine not found, skipping animation"
  exit 0
fi

# In Claude Code, skip animation frames and show only the result line
if [ -n "$CLAUDECODE" ]; then
  $GSM play "$HASH" --small 2>&1 | tail -1
else
  $GSM play "$HASH" --small
fi
`;
