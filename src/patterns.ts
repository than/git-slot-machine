export enum PatternType {
  ALL_SAME = 'ALL_SAME',
  SIX_OF_KIND = 'SIX_OF_KIND',
  FULLEST_HOUSE = 'FULLEST_HOUSE', // 4-3
  FIVE_OF_KIND = 'FIVE_OF_KIND',
  FOUR_OF_KIND = 'FOUR_OF_KIND',
  THREE_OF_KIND_PLUS_THREE = 'THREE_OF_KIND_PLUS_THREE', // 3-3-1
  FULL_HOUSE = 'FULL_HOUSE', // 4-2-1 or 3-2-2
  THREE_PAIR = 'THREE_PAIR',
  THREE_OF_KIND = 'THREE_OF_KIND',
  TWO_PAIR = 'TWO_PAIR',
  ONE_PAIR = 'ONE_PAIR',
  NO_WIN = 'NO_WIN'
}

export interface PatternResult {
  type: PatternType;
  name: string;
  payout: number;
  description: string;
}

const PAYOUTS: Record<PatternType, { name: string; payout: number; description: string }> = {
  [PatternType.ALL_SAME]: { name: 'JACKPOT', payout: 1000, description: 'All same character' },
  [PatternType.SIX_OF_KIND]: { name: 'LEGENDARY', payout: 500, description: 'Six of a kind' },
  [PatternType.FULLEST_HOUSE]: { name: 'FULLEST HOUSE', payout: 250, description: '4 + 3 of a kind' },
  [PatternType.FIVE_OF_KIND]: { name: 'EPIC', payout: 100, description: 'Five of a kind' },
  [PatternType.FOUR_OF_KIND]: { name: 'RARE', payout: 50, description: 'Four of a kind' },
  [PatternType.THREE_OF_KIND_PLUS_THREE]: { name: 'DOUBLE TRIPLE', payout: 30, description: 'Two three of a kinds' },
  [PatternType.FULL_HOUSE]: { name: 'FULL HOUSE', payout: 20, description: 'Three and two of a kind' },
  [PatternType.THREE_PAIR]: { name: 'THREE PAIR', payout: 15, description: 'Three pairs' },
  [PatternType.THREE_OF_KIND]: { name: 'THREE OF A KIND', payout: 10, description: 'Three of a kind' },
  [PatternType.TWO_PAIR]: { name: 'TWO PAIR', payout: 5, description: 'Two pairs' },
  [PatternType.ONE_PAIR]: { name: 'PAIR', payout: 2, description: 'One pair' },
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

export function detectPattern(hash: string): PatternResult {
  // Validate input
  if (hash.length !== 7) {
    throw new Error('Hash must be 7 characters');
  }
  if (!/^[0-9a-f]+$/i.test(hash)) {
    throw new Error('Hash must contain only hex characters');
  }

  const counts = countCharacters(hash.toLowerCase());
  const distribution = getCountDistribution(counts);

  // Detect pattern based on distribution
  let type: PatternType;

  if (distribution[0] === 7) {
    type = PatternType.ALL_SAME;
  } else if (distribution[0] === 6) {
    type = PatternType.SIX_OF_KIND;
  } else if (distribution[0] === 5 && distribution[1] === 2) {
    type = PatternType.FIVE_OF_KIND;
  } else if (distribution[0] === 5) {
    type = PatternType.FIVE_OF_KIND;
  } else if (distribution[0] === 4 && distribution[1] === 3) {
    type = PatternType.FULLEST_HOUSE;
  } else if (distribution[0] === 4 && distribution[1] === 2) {
    type = PatternType.FULL_HOUSE;
  } else if (distribution[0] === 4) {
    type = PatternType.FOUR_OF_KIND;
  } else if (distribution[0] === 3 && distribution[1] === 3) {
    type = PatternType.THREE_OF_KIND_PLUS_THREE;
  } else if (distribution[0] === 3 && distribution[1] === 2 && distribution[2] === 2) {
    type = PatternType.FULL_HOUSE;
  } else if (distribution[0] === 3 && distribution[1] === 2) {
    type = PatternType.FULL_HOUSE;
  } else if (distribution[0] === 3) {
    type = PatternType.THREE_OF_KIND;
  } else if (distribution[0] === 2 && distribution[1] === 2 && distribution[2] === 2) {
    type = PatternType.THREE_PAIR;
  } else if (distribution[0] === 2 && distribution[1] === 2) {
    type = PatternType.TWO_PAIR;
  } else if (distribution[0] === 2) {
    type = PatternType.ONE_PAIR;
  } else {
    type = PatternType.NO_WIN;
  }

  const config = PAYOUTS[type];
  return {
    type,
    name: config.name,
    payout: config.payout,
    description: config.description
  };
}
