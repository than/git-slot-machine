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

## Development

```bash
npm install
npm run build
```
