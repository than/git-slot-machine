import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectPattern, PatternType } from './patterns.js';

// Canonical ruleset (single source of truth, v3). Loaded via fs so the test does
// not depend on the jest transform's JSON-module support; the path is relative to
// this source file's directory.
interface RulesetPattern {
  type: string;
  name: string;
  priority: number;
  payout: number;
  net: number;
  example: string | null;
}
interface Ruleset {
  rulesetVersion: number;
  totalHashes: number;
  rtp: number;
  patterns: RulesetPattern[];
}
const ruleset: Ruleset = JSON.parse(
  readFileSync(join(__dirname, 'patterns.json'), 'utf8')
);

// Shared golden fixture covering all 19 pattern types (payouts are v3).
interface GoldenVector {
  hash: string;
  type: string;
  name: string;
  payout: number;
}
const goldenVectors: GoldenVector[] = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'golden-vectors.json'), 'utf8')
);

describe('GOLDEN CONTRACT', () => {
  it('classifies every golden vector with the expected type, name, and payout', () => {
    expect(goldenVectors.length).toBeGreaterThan(0);
    for (const vector of goldenVectors) {
      const result = detectPattern(vector.hash);
      expect({
        hash: vector.hash,
        type: result.type,
        name: result.name,
        payout: result.payout,
      }).toEqual({
        hash: vector.hash,
        type: vector.type,
        name: vector.name,
        payout: vector.payout,
      });
    }
  });

  it('covers all 19 pattern types', () => {
    const seen = new Set(goldenVectors.map((v) => v.type));
    expect(seen.size).toBe(19);
  });
});

describe('CANONICAL PAYOUT CONTRACT', () => {
  // Proves the in-code PAYOUTS table equals patterns.json (catches drift).
  for (const pattern of ruleset.patterns) {
    if (pattern.example == null) continue;
    it(`${pattern.type}: in-code payout/name match patterns.json`, () => {
      const result = detectPattern(pattern.example as string);
      expect(result.payout).toBe(pattern.payout);
      expect(result.name).toBe(pattern.name);
    });
  }
});

describe('TRICKY-RULE CASES', () => {
  const cases: Array<[string, PatternType]> = [
    ['a1a2345', PatternType.NO_WIN], // non-adjacent pair does not count
    ['ab1ab2c', PatternType.NO_WIN], // non-adjacent pairs don't count
    ['abcdefa', PatternType.STRAIGHT_6], // a-b-c-d-e-f run, not all-letters (priority)
    ['aaabbcc', PatternType.ALL_LETTERS], // all letters beats the frequency groupings here
    ['1234567', PatternType.STRAIGHT_7],
    ['7777777', PatternType.LUCKY_SEVENS], // secret jackpot
    ['0123455', PatternType.STRAIGHT_6], // 0-1-2-3-4-5 run with trailing dup
  ];
  for (const [hash, expectedType] of cases) {
    it(`${hash} -> ${expectedType}`, () => {
      expect(detectPattern(hash).type).toBe(expectedType);
    });
  }
});

describe('EXAMPLE VALIDATION', () => {
  // Every pattern's `example` must classify back to its own type.
  for (const pattern of ruleset.patterns) {
    if (pattern.example == null) continue;
    it(`${pattern.type}: example "${pattern.example}" classifies as ${pattern.type}`, () => {
      expect(detectPattern(pattern.example as string).type).toBe(pattern.type);
    });
  }
});
