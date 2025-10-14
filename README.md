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

# Install post-commit hook
git-slot-machine init

# Check your balance
git-slot-machine balance
```

## Winning Patterns & Payouts

Every commit costs **10 credits**. You start with **100 credits**.

| Pattern | Example | Payout | Odds | Description |
|---------|---------|--------|------|-------------|
| **JACKPOT** | `aaaaaaa` | +10000 | 1 in 16,777,216 | All same character |
| **HEXTET** | `aaaaaa1` | +5000 | 1 in 159,784 | Six of a kind |
| **LUCKY SEVEN** | `1234567` | +2500 | Very Rare | Seven in a row |
| **FULLEST HOUSE** | `aaaabbb` | +2000 | 1 in 31,956 | 4 + 3 of a kind |
| **FIVE OF A KIND** | `aaaaa12` | +1000 | 1 in 7,989 | Five of a kind |
| **BIG STRAIGHT** | `a012345` | +500 | Rare | Six in a row |
| **FOUR OF A KIND** | `aaaa123` | +400 | 1 in 799 | Four of a kind |
| **ALL LETTERS** | `abcdefa` | +300 | 1 in 959 | Only letters (a-f) |
| **STRAIGHT** | `ab01234` | +200 | Uncommon | Five in a row |
| **DOUBLE TRIPLE** | `aaabbb1` | +150 | 1 in ~2,000 | Two three of a kinds |
| **FULL HOUSE** | `aaaabb1` | +100 | 1 in ~1,000 | Three and two of a kind |
| **THREE PAIR** | `aabbcc1` | +75 | 1 in 58 | Three pairs |
| **THREE OF A KIND** | `aaa1234` | +50 | 1 in 133 | Three of a kind |
| **TWO PAIR** | `aa11bcd` | +25 | 1 in 5.67 | Two pairs |
| **ALL NUMBERS** | `1230984` | +10 | 1 in 26.8 | Only numbers (break even) |
| **NO WIN** | `abcd123` | -10 | ~50% | No pattern (includes one pair) |

## Statistics & Probabilities

For the nerds who love the math:

### Win Rate Analysis

| Category | Percentage | Expected Value |
|----------|------------|----------------|
| **Total Win Rate** | ~50% | Break even |
| **No Win Rate** | ~50% | -10 credits |
| **Profit Rate** | ~47% | Positive return |
| **Break Even Rate** | ~3.7% | 0 net (all numbers) |

### Pattern Frequency (per 1M commits)

| Pattern | Probability | Expected Value | ROI per Win |
|---------|-------------|----------------|-------------|
| JACKPOT | 1 in 16,777,216 | +0.0006 | +99,900% |
| HEXTET | 1 in 159,784 | +0.031 | +49,900% |
| LUCKY SEVEN | Very Rare | ~0.001 | +24,900% |
| FULLEST HOUSE | 1 in 31,956 | +0.062 | +19,900% |
| FIVE OF A KIND | 1 in 7,989 | +0.125 | +9,900% |
| BIG STRAIGHT | Rare | ~0.018 | +4,900% |
| FOUR OF A KIND | 1 in 799 | +0.501 | +3,900% |
| ALL LETTERS | 1 in 959 | +0.312 | +2,900% |
| STRAIGHT | Uncommon | ~0.112 | +1,900% |
| DOUBLE TRIPLE | 1 in ~2,000 | ~0.075 | +1,400% |
| FULL HOUSE | 1 in ~1,000 | ~0.100 | +900% |
| THREE PAIR | 1 in 58 | +1.289 | +650% |
| THREE OF A KIND | 1 in 133 | +0.376 | +400% |
| TWO PAIR | 1 in 5.67 | +2.646 | +150% |
| ALL NUMBERS | 1 in 26.8 | +0.000 | 0% |
| **TOTAL EV** | - | **~10.0** | **~0%** |

### House Edge

- **Cost per play:** 10 credits
- **Expected return:** ~10 credits
- **House edge:** ~0% (balanced for fun!)
- **Standard deviation:** High variance (big wins are rare but huge)

### Rarest Patterns

1. **JACKPOT** - Once every 16.7 million commits
2. **HEXTET** - Once every 159,784 commits
3. **LUCKY SEVEN** - Once every ~2.5 million commits (exact odds vary by hex sequence)

### Most Common Patterns

1. **TWO PAIR** - Every 5.67 commits (~17.6%)
2. **THREE PAIR** - Every 58 commits (~1.7%)
3. **ALL NUMBERS** - Every 26.8 commits (~3.7%)

### Expected Gameplay

**If you make 100 commits, you can expect:**
- ~50 losses (-500 credits)
- ~18 two pairs (+450 credits)
- ~4 all numbers (0 credits)
- ~2 three of a kinds (+100 credits)
- ~1 three pair (+75 credits)
- ~1 four of a kind (+400 credits)
- Occasional straights and other rarer patterns

**Net result:** Roughly break even with high variance!

### Longest Expected Droughts

- **JACKPOT**: You'd need to commit ~46,000 times per day for 1,000 years to statistically see one
- **HEXTET**: ~440 commits per day for 1 year
- **LUCKY SEVEN**: ~6,850 commits per day for 1 year
- **FULLEST HOUSE**: ~88 commits per day for 1 year

### Fastest to Hit (statistically)

- **TWO PAIR**: Should see one in your first 6 commits
- **ALL NUMBERS**: Should see one in your first 27 commits
- **THREE PAIR**: Should see one in your first 58 commits

### Commit Milestones

- **10 commits**: Likely seen 1-2 two pairs
- **100 commits**: Should have hit at least one three pair and possibly a four of a kind
- **1,000 commits**: Decent chance of seeing a straight or all letters
- **10,000 commits**: Good shot at a fullest house or five of a kind
- **100,000 commits**: Might see a hextet if you're lucky
- **1,000,000 commits**: JACKPOT is still astronomically unlikely

*Note: Actual probabilities may vary slightly based on specific hex character sequences and pattern detection order.*

## Development

```bash
npm install
npm run build
```
