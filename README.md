# 🎰 Git Slot Machine

[![Git Slot Machine](https://gitslotmachine.com/badge/than/git-slot-machine.svg)](https://gitslotmachine.com)

[![npm version](https://img.shields.io/npm/v/git-slot-machine.svg)](https://www.npmjs.com/package/git-slot-machine)
[![npm downloads](https://img.shields.io/npm/dt/git-slot-machine.svg)](https://www.npmjs.com/package/git-slot-machine)
[![license](https://img.shields.io/npm/l/git-slot-machine.svg)](https://github.com/than/git-slot-machine/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/than/git-slot-machine.svg)](https://github.com/than/git-slot-machine/stargazers)

**Turn every git commit into a slot machine pull!**

A fun CLI tool that analyzes your commit hashes and rewards you based on patterns found in the first 7 hex characters. Automatically plays after each commit via a post-commit hook, syncs with a global leaderboard, and tracks your stats across all your repos.

🎰 **Live Leaderboard:** [gitslotmachine.com](https://gitslotmachine.com)
🔧 **Backend API:** [GitHub](https://github.com/than/gitslotmachine.com)

---

## Quick Start

```bash
# Install globally
npm install -g git-slot-machine

# Install post-commit hook in your repo
cd your-repo
git-slot-machine init

# (during init, you'll be prompted to join the leaderboard)

# Make a commit and watch the magic happen!
git commit -m "feat: add new feature"
# 🎰 aa1bb2c • TWO PAIR +50 • Balance: 150
```

---

## Features

✅ **Automatic gameplay** - Plays after every commit via post-commit hook
✅ **Global sync** - Balance and stats sync across all your repos
✅ **Leaderboards** - Daily and all-time rankings at gitslotmachine.com
✅ **Win streaks** - Track consecutive wins with detailed history
✅ **Shareable wins** - Get a unique URL for your big wins
✅ **Offline mode** - Works without internet, syncs when available
✅ **Multiple modes** - Animated slot machine or compact single-line output

---

## Installation

```bash
npm install -g git-slot-machine
```

---

## Commands

### Authentication

```bash
# Login with your GitHub username
git-slot-machine login <your-github-username>

# Check authentication status
git-slot-machine status

# Logout
git-slot-machine logout
```

### Gameplay

```bash
# Play with a specific 7-character hash
git-slot-machine play <hash>

# Play with current commit
git-slot-machine spin

# Play with current commit (compact mode)
git-slot-machine spin --small

# Test with a random hash
git-slot-machine test
```

### Setup

```bash
# Install post-commit hook in current repo
git-slot-machine init

# Check your balance and stats
git-slot-machine balance

# Sync local balance with server
git-slot-machine sync
```

### Configuration

```bash
# View current configuration
git-slot-machine config list

# Set API URL (default: Laravel Cloud)
git-slot-machine config set api-url https://api.gitslotmachine.com/api

# Enable/disable automatic syncing
git-slot-machine config set sync-enabled true
```

---

## Winning Patterns & Payouts

Every commit costs **10 points**. You start with **100 points**.

| Pattern | Example | Payout | Probability | Expected Value | ROI per Win | Description |
|---------|---------|--------|-------------|----------------|-------------|-------------|
| **JACKPOT** | `aaaaaaa` | +10,000 | 1 in 16,777,216 | +0.0006 | +99,900% | All same character |
| **HEXTET** | `aaaaaa1` | +5,000 | 1 in 159,784 | +0.031 | +49,900% | Six of a kind |
| **LUCKY SEVEN** | `1234567` | +2,500 | 1 in ~2,500,000 | ~+0.001 | +24,900% | Seven in a row |
| **FULLEST HOUSE** | `aaaabbb` | +2,000 | 1 in 31,956 | +0.063 | +19,900% | 4 + 3 of a kind |
| **FIVE OF A KIND** | `aaaaa12` | +1,000 | 1 in 7,989 | +0.125 | +9,900% | Five of a kind |
| **BIG STRAIGHT** | `012345a` | +500 | 1 in ~280,000 | ~+0.002 | +4,900% | Six in a row |
| **FOUR OF A KIND** | `aaaa123` | +400 | 1 in 799 | +0.501 | +3,900% | Four of a kind |
| **ALL LETTERS** | `abcdefa` | +300 | 1 in 959 | +0.313 | +2,900% | Only letters (a-f) |
| **STRAIGHT** | `01234ab` | +200 | 1 in ~9,000 | ~+0.022 | +1,900% | Five in a row |
| **DOUBLE TRIPLE** | `aaabbb1` | +150 | 1 in ~2,000 | ~+0.075 | +1,400% | Two three of a kinds |
| **FULL HOUSE** | `aaaabb1` | +100 | 1 in ~1,000 | ~+0.100 | +900% | Three and two of a kind |
| **THREE PAIR** | `aabbcc1` | +150 | 1 in ~1,600 | ~+0.094 | +1,400% | Three consecutive pairs |
| **THREE OF A KIND** | `aaa1234` | +50 | 1 in 15 | +3.333 | +400% | Three of a kind |
| **TWO PAIR** | `aabb1cd` | +50 | 1 in 45 | +1.111 | +400% | Two consecutive pairs |
| **ALL NUMBERS** | `1230984` | +10 | 1 in 26.8 | +0.373 | 0% | Only numbers (break even) |
| **NO WIN** | `abcd123` | -10 | ~35% | ~-3.5 | -200% | No pattern |

## Statistics & Probabilities

For the nerds who love the math:

### Win Rate Analysis

| Category | Percentage | Expected Value |
|----------|------------|----------------|
| **Total Win Rate** | ~65% | Positive EV |
| **No Win Rate** | ~35% | -10 points |
| **Profit Rate** | ~61% | Positive return |
| **Break Even Rate** | ~3.7% | 0 net (all numbers) |

### Pattern Rarity Tiers

**Legendary (Once in a lifetime):**
- JACKPOT, HEXTET, LUCKY SEVEN

**Epic (Very rare):**
- FULLEST HOUSE, FIVE OF A KIND, BIG STRAIGHT

**Rare (Uncommon):**
- FOUR OF A KIND, ALL LETTERS, STRAIGHT

**Uncommon (Regular wins):**
- DOUBLE TRIPLE, FULL HOUSE, THREE PAIR

**Common (Frequent wins):**
- THREE OF A KIND, TWO PAIR, ALL NUMBERS

### Expected Gameplay

**If you make 100 commits, you can expect:**
- ~35 no wins (-350 points)
- ~3 two pairs (+150 points)
- ~4 all numbers (+40 points)
- ~1 three of a kind (+50 points)
- Various rarer patterns adding up to roughly break even or slight positive

**Net result:** Slight positive expectation with high variance!

### Longest Expected Droughts

- **JACKPOT**: You'd need to commit ~46,000 times per day for 1,000 years to statistically see one
- **HEXTET**: ~440 commits per day for 1 year
- **LUCKY SEVEN**: ~6,850 commits per day for 1 year
- **FULLEST HOUSE**: ~88 commits per day for 1 year

### Fastest to Hit (statistically)

- **THREE OF A KIND**: Most common win, about 1 in 15 commits
- **ALL NUMBERS**: Break even, about 1 in 27 commits
- **TWO PAIR**: Should see one in your first 45 commits

### Commit Milestones

- **10 commits**: Likely seen some all numbers, maybe a two pair
- **100 commits**: Should have hit at least one two pair and three of a kind
- **1,000 commits**: Decent chance of seeing a four of a kind or straight
- **10,000 commits**: Good shot at a fullest house or five of a kind
- **100,000 commits**: Might see a hextet if you're lucky
- **1,000,000 commits**: JACKPOT is still astronomically unlikely

### House Edge

- **Cost per play:** 10 points
- **Expected return:** ~10+ points
- **House edge:** Slight player advantage (balanced for fun!)
- **Standard deviation:** High variance (big wins are rare but huge)

## Pattern Detection Details

### Consecutive Pairs
TWO PAIR and THREE PAIR require consecutive identical characters:
- `aabb1cd` = TWO PAIR ✓ (pairs are `aa` and `bb`)
- `a1b2abc` = NO WIN ✗ (a's and b's are separated)

### Straights
Must be sequential hex values (can be ascending or descending):
- `0123456` = LUCKY SEVEN ✓
- `fedcba9` = LUCKY SEVEN ✓
- `012abc3` = NO WIN ✗

### Frequency Patterns
Based on character counts:
- Three of a kind beats scattered pairs
- Full house beats three of a kind
- Pattern priority is checked from rarest to most common

*Note: Actual probabilities are approximate. Pattern detection checks in order of rarity, so higher-value patterns take precedence.*

## How It Works

1. **Install the hook**: `git-slot-machine init` adds a post-commit hook to your repo
2. **Make commits**: Every time you commit, the hook runs automatically
3. **Get results**: See your pattern, payout, and updated balance immediately
4. **Sync globally**: Your plays sync to gitslotmachine.com (if authenticated)
5. **Compete**: Climb the leaderboards and build win streaks!

### Privacy & Data

The CLI sends the following data to the server when authenticated:
- Commit hash (first 7 chars + full hash)
- Repository information (URL, owner, name)
- GitHub username
- Pattern detected and payout

Your balance is tracked both locally and on the server. You can disable syncing anytime:
```bash
git-slot-machine config set sync-enabled false
```

---

## Development

### Setup

```bash
# Clone the repo
git clone https://github.com/than/git-slot-machine.git
cd git-slot-machine

# Install dependencies
npm install

# Build TypeScript
npm run build

# Link for local testing
npm link

# Run tests (if available)
npm test
```

### Project Structure

```
src/
├── api.ts          # API client with fallback domains
├── balance.ts      # Local balance management
├── commands/       # CLI command implementations
│   ├── auth.ts     # Authentication commands
│   ├── config.ts   # Configuration commands
│   ├── init.ts     # Post-commit hook setup
│   ├── play.ts     # Play with specific hash
│   ├── spin.ts     # Play with current commit
│   └── sync.ts     # Balance sync
├── config.ts       # Configuration file management
├── index.ts        # CLI entry point
├── patterns.ts     # Pattern detection logic
└── utils/
    └── git.ts      # Git operations

dist/               # Compiled JavaScript
```

---

## Contributing

Contributions welcome! Please feel free to:
- Open issues for bugs or feature requests
- Submit pull requests
- Share your biggest wins!

---

## Support

Enjoying Git Slot Machine? Consider sponsoring development:

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-pink?logo=github)](https://github.com/sponsors/than)

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Credits

Built by [Than Tibbetts](https://github.com/than)

Powered by Node.js, TypeScript, and chalk
