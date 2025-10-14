export enum PatternType {
  ALL_SAME = 'ALL_SAME',
  SIX_OF_KIND = 'SIX_OF_KIND',
  STRAIGHT_7 = 'STRAIGHT_7',
  FULLEST_HOUSE = 'FULLEST_HOUSE', // 4-3
  FIVE_OF_KIND = 'FIVE_OF_KIND',
  STRAIGHT_6 = 'STRAIGHT_6',
  FOUR_OF_KIND = 'FOUR_OF_KIND',
  ALL_LETTERS = 'ALL_LETTERS',
  STRAIGHT_5 = 'STRAIGHT_5',
  THREE_OF_KIND_PLUS_THREE = 'THREE_OF_KIND_PLUS_THREE', // 3-3-1
  FULL_HOUSE = 'FULL_HOUSE', // 4-2-1 or 3-2-2
  THREE_PAIR = 'THREE_PAIR',
  THREE_OF_KIND = 'THREE_OF_KIND',
  TWO_PAIR = 'TWO_PAIR',
  ALL_NUMBERS = 'ALL_NUMBERS',
  NO_WIN = 'NO_WIN'
}

export interface PatternResult {
  type: PatternType;
  name: string;
  payout: number;
  description: string;
  highlightIndices: number[]; // Indices of characters to highlight
}

const PAYOUTS: Record<PatternType, { name: string; payout: number; description: string }> = {
  [PatternType.ALL_SAME]: { name: 'JACKPOT', payout: 10000, description: 'All same character' },
  [PatternType.SIX_OF_KIND]: { name: 'HEXTET', payout: 5000, description: 'Six of a kind' },
  [PatternType.STRAIGHT_7]: { name: 'LUCKY SEVEN', payout: 2500, description: 'Seven in a row' },
  [PatternType.FULLEST_HOUSE]: { name: 'FULLEST HOUSE', payout: 2000, description: '4 + 3 of a kind' },
  [PatternType.FIVE_OF_KIND]: { name: 'FIVE OF A KIND', payout: 1000, description: 'Five of a kind' },
  [PatternType.STRAIGHT_6]: { name: 'BIG STRAIGHT', payout: 500, description: 'Six in a row' },
  [PatternType.FOUR_OF_KIND]: { name: 'FOUR OF A KIND', payout: 400, description: 'Four of a kind' },
  [PatternType.ALL_LETTERS]: { name: 'ALL LETTERS', payout: 300, description: 'Only letters (a-f)' },
  [PatternType.STRAIGHT_5]: { name: 'STRAIGHT', payout: 200, description: 'Five in a row' },
  [PatternType.THREE_OF_KIND_PLUS_THREE]: { name: 'DOUBLE TRIPLE', payout: 150, description: 'Two three of a kinds' },
  [PatternType.FULL_HOUSE]: { name: 'FULL HOUSE', payout: 100, description: 'Three and two of a kind' },
  [PatternType.THREE_PAIR]: { name: 'THREE PAIR', payout: 75, description: 'Three pairs' },
  [PatternType.THREE_OF_KIND]: { name: 'THREE OF A KIND', payout: 50, description: 'Three of a kind' },
  [PatternType.TWO_PAIR]: { name: 'TWO PAIR', payout: 25, description: 'Two pairs' },
  [PatternType.ALL_NUMBERS]: { name: 'ALL NUMBERS', payout: 10, description: 'Only numbers (0-9)' },
  [PatternType.NO_WIN]: { name: 'NO WIN', payout: 0, description: 'No winning pattern' }
};

function countCharacters(hash: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const char of hash) {
    counts.set(char, (counts.get(char) || 0) + 1);
  }
  return counts;
}

function getCountDistribution(counts: Map<string, number>): number[] {
  return Array.from(counts.values()).sort((a, b) => b - a);
}

function hasSequentialRun(hash: string, length: number): boolean {
  const hexValues = '0123456789abcdef';

  for (let i = 0; i <= hash.length - length; i++) {
    const substring = hash.substring(i, i + length);

    // Check ascending
    let isAscending = true;
    for (let j = 0; j < substring.length - 1; j++) {
      const currentIndex = hexValues.indexOf(substring[j]);
      const nextIndex = hexValues.indexOf(substring[j + 1]);
      if (nextIndex !== currentIndex + 1) {
        isAscending = false;
        break;
      }
    }
    if (isAscending) return true;

    // Check descending
    let isDescending = true;
    for (let j = 0; j < substring.length - 1; j++) {
      const currentIndex = hexValues.indexOf(substring[j]);
      const nextIndex = hexValues.indexOf(substring[j + 1]);
      if (nextIndex !== currentIndex - 1) {
        isDescending = false;
        break;
      }
    }
    if (isDescending) return true;
  }

  return false;
}

function isAllLetters(hash: string): boolean {
  return /^[a-f]+$/i.test(hash);
}

function isAllNumbers(hash: string): boolean {
  return /^[0-9]+$/.test(hash);
}

function getHighlightIndices(hash: string, type: PatternType): number[] {
  const lowerHash = hash.toLowerCase();

  // For straights, highlight all characters in the sequential run
  if (type === PatternType.STRAIGHT_7 || type === PatternType.STRAIGHT_6 || type === PatternType.STRAIGHT_5) {
    const length = type === PatternType.STRAIGHT_7 ? 7 : type === PatternType.STRAIGHT_6 ? 6 : 5;
    const hexValues = '0123456789abcdef';

    for (let i = 0; i <= lowerHash.length - length; i++) {
      const substring = lowerHash.substring(i, i + length);
      let isSequential = true;

      // Check ascending
      for (let j = 0; j < substring.length - 1; j++) {
        const currentIndex = hexValues.indexOf(substring[j]);
        const nextIndex = hexValues.indexOf(substring[j + 1]);
        if (nextIndex !== currentIndex + 1 && nextIndex !== currentIndex - 1) {
          isSequential = false;
          break;
        }
      }

      if (isSequential) {
        return Array.from({ length }, (_, idx) => i + idx);
      }
    }
  }

  // For all letters or all numbers, highlight everything
  if (type === PatternType.ALL_LETTERS || type === PatternType.ALL_NUMBERS || type === PatternType.ALL_SAME) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  // For frequency-based patterns, highlight characters that appear in the pattern
  const counts = countCharacters(lowerHash);
  const indices: number[] = [];

  if (type === PatternType.SIX_OF_KIND || type === PatternType.FIVE_OF_KIND ||
      type === PatternType.FOUR_OF_KIND || type === PatternType.THREE_OF_KIND) {
    // Find the character with the highest count and highlight all occurrences
    const targetCount = type === PatternType.SIX_OF_KIND ? 6 :
                        type === PatternType.FIVE_OF_KIND ? 5 :
                        type === PatternType.FOUR_OF_KIND ? 4 : 3;

    for (const [char, count] of counts.entries()) {
      if (count === targetCount) {
        for (let i = 0; i < lowerHash.length; i++) {
          if (lowerHash[i] === char) {
            indices.push(i);
          }
        }
        break;
      }
    }
  }
  else if (type === PatternType.FULLEST_HOUSE || type === PatternType.FULL_HOUSE ||
           type === PatternType.THREE_OF_KIND_PLUS_THREE) {
    // Highlight all paired/tripled characters
    for (const [char, count] of counts.entries()) {
      if (count >= 2) {
        for (let i = 0; i < lowerHash.length; i++) {
          if (lowerHash[i] === char) {
            indices.push(i);
          }
        }
      }
    }
  }
  else if (type === PatternType.THREE_PAIR || type === PatternType.TWO_PAIR) {
    // Highlight all paired characters
    for (const [char, count] of counts.entries()) {
      if (count === 2) {
        for (let i = 0; i < lowerHash.length; i++) {
          if (lowerHash[i] === char) {
            indices.push(i);
          }
        }
      }
    }
  }

  return indices.sort((a, b) => a - b);
}

export function detectPattern(hash: string): PatternResult {
  // Validate input
  if (hash.length !== 7) {
    throw new Error('Hash must be 7 characters');
  }
  if (!/^[0-9a-f]+$/i.test(hash)) {
    throw new Error('Hash must contain only hex characters');
  }

  const lowerHash = hash.toLowerCase();
  const counts = countCharacters(lowerHash);
  const distribution = getCountDistribution(counts);

  // Detect pattern - check in order of rarity/value
  let type: PatternType;

  // Check for all same first (highest value)
  if (distribution[0] === 7) {
    type = PatternType.ALL_SAME;
  }
  // Check for 6 of a kind
  else if (distribution[0] === 6) {
    type = PatternType.SIX_OF_KIND;
  }
  // Check for straight 7 (very rare)
  else if (hasSequentialRun(lowerHash, 7)) {
    type = PatternType.STRAIGHT_7;
  }
  // Check for fullest house (4-3)
  else if (distribution[0] === 4 && distribution[1] === 3) {
    type = PatternType.FULLEST_HOUSE;
  }
  // Check for 5 of a kind
  else if (distribution[0] === 5) {
    type = PatternType.FIVE_OF_KIND;
  }
  // Check for straight 6
  else if (hasSequentialRun(lowerHash, 6)) {
    type = PatternType.STRAIGHT_6;
  }
  // Check for 4 of a kind
  else if (distribution[0] === 4) {
    type = PatternType.FOUR_OF_KIND;
  }
  // Check for all letters
  else if (isAllLetters(lowerHash)) {
    type = PatternType.ALL_LETTERS;
  }
  // Check for straight 5
  else if (hasSequentialRun(lowerHash, 5)) {
    type = PatternType.STRAIGHT_5;
  }
  // Check for double triple (3-3-1)
  else if (distribution[0] === 3 && distribution[1] === 3) {
    type = PatternType.THREE_OF_KIND_PLUS_THREE;
  }
  // Check for full house (3-2-2 or 3-2-1-1)
  else if (distribution[0] === 3 && distribution[1] === 2) {
    type = PatternType.FULL_HOUSE;
  }
  // Check for three pair
  else if (distribution[0] === 2 && distribution[1] === 2 && distribution[2] === 2) {
    type = PatternType.THREE_PAIR;
  }
  // Check for 3 of a kind
  else if (distribution[0] === 3) {
    type = PatternType.THREE_OF_KIND;
  }
  // Check for two pair
  else if (distribution[0] === 2 && distribution[1] === 2) {
    type = PatternType.TWO_PAIR;
  }
  // Check for all numbers (break-even)
  else if (isAllNumbers(lowerHash)) {
    type = PatternType.ALL_NUMBERS;
  }
  // Everything else is no win (including one pair)
  else {
    type = PatternType.NO_WIN;
  }

  const config = PAYOUTS[type];
  return {
    type,
    name: config.name,
    payout: config.payout,
    description: config.description,
    highlightIndices: getHighlightIndices(hash, type)
  };
}
