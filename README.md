# git-slot-machine

Git commit hash slot machine with animated ASCII output.

## Installation

```bash
npm install -g git-slot-machine
```

## Usage

```bash
# Play with a specific hash
git-slot-machine play <hash>

# Play with current commit
git-slot-machine spin

# Play with current commit (single-line animated mode)
git-slot-machine spin --small

# Install post-commit hook
git-slot-machine init

# Check your balance
git-slot-machine balance

# Test with a random hash
git-slot-machine test
```

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

## Development

```bash
npm install
npm run build
npm test
```

## Commands

- `play <hash>` - Play with a specific 7-character hash
- `spin` - Play with the current git commit hash
- `test` - Play with a random hash (for testing)
- `balance` - Show your current balance and stats
- `init` - Install post-commit hook to play automatically

## Options

- `--small` or `-s` - Single-line animated mode (great for post-commit hooks)

## Post-Commit Hook

Run `git-slot-machine init` to install a post-commit hook that automatically plays the slot machine after each commit in small mode.
