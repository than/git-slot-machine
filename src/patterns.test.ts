import { detectPattern, PatternType } from './patterns.js';

describe('Pattern Detection', () => {
  it('detects all same character', () => {
    const result = detectPattern('aaaaaaa');
    expect(result.type).toBe(PatternType.ALL_SAME);
    expect(result.name).toBe('JACKPOT');
  });

  it('detects 4 of a kind', () => {
    const result = detectPattern('aaaa123');
    expect(result.type).toBe(PatternType.FOUR_OF_KIND);
    expect(result.payout).toBeGreaterThan(0);
  });

  it('detects fullest house (4-3)', () => {
    const result = detectPattern('aaaabbb');
    expect(result.type).toBe(PatternType.FULLEST_HOUSE);
  });

  it('detects three pair', () => {
    const result = detectPattern('aabbcc1');
    expect(result.type).toBe(PatternType.THREE_PAIR);
  });

  it('detects one pair', () => {
    // Avoid a 5+ sequential run, which would rank as a STRAIGHT instead.
    const result = detectPattern('aa13579');
    expect(result.type).toBe(PatternType.ONE_PAIR);
  });

  it('detects a 5-digit straight', () => {
    const result = detectPattern('12345ab');
    expect(result.type).toBe(PatternType.STRAIGHT_5);
    expect(result.payout).toBeGreaterThan(0);
  });

  it('detects a 6-digit straight', () => {
    const result = detectPattern('123456a');
    expect(result.type).toBe(PatternType.STRAIGHT_6);
  });

  it('detects a 7-digit straight', () => {
    const result = detectPattern('1234567');
    expect(result.type).toBe(PatternType.STRAIGHT_7);
  });

  it('detects no win', () => {
    // Mixed hex with no pair, run, or all-letters/all-numbers grouping.
    const result = detectPattern('a1b2c3d');
    expect(result.type).toBe(PatternType.NO_WIN);
    expect(result.payout).toBe(0);
  });

  it('validates hash length', () => {
    expect(() => detectPattern('abc')).toThrow('Hash must be 7 characters');
  });

  it('validates hex characters', () => {
    expect(() => detectPattern('gggggg1')).toThrow('Hash must contain only hex characters');
  });
});
