#!/usr/bin/env node
// Exhaustive verification of the git-slot-machine ruleset odds.
//
// Enumerates all 16^7 = 268,435,456 seven-hex-char strings through a fast
// integer classifier that replicates src/patterns.ts EXACTLY, then asserts the
// resulting per-pattern NET counts, totals, and RTP match src/patterns.json.
//
// This is intentionally NOT a Jest test: a full enumeration takes ~15s. Run via
// `pnpm verify:odds`.
//
// Usage: node scripts/verify-odds.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TOTAL = 16 ** 7; // 268,435,456

// --- Load canonical ruleset -------------------------------------------------
const ruleset = JSON.parse(
  readFileSync(join(ROOT, 'src', 'patterns.json'), 'utf8')
);

// Stake per spin (RTP denominator factor). Falls back to 10 if absent.
const COST = ruleset.cost ?? 10;

// --- Fast integer classifier (mirror of src/patterns.ts) --------------------
//
// A hash is represented as 7 hex digit values d[0..6], each 0..15.
// Letters a-f are digit values 10..15; numbers 0-9 are values 0..9.
//
// Pattern type ids (string labels match patterns.json `type`).

const T = {
  LUCKY_SEVENS: 'LUCKY_SEVENS',
  ALL_SAME: 'ALL_SAME',
  SIX_OF_KIND: 'SIX_OF_KIND',
  STRAIGHT_7: 'STRAIGHT_7',
  FULLEST_HOUSE: 'FULLEST_HOUSE',
  FIVE_OF_KIND: 'FIVE_OF_KIND',
  STRAIGHT_6: 'STRAIGHT_6',
  FOUR_OF_KIND: 'FOUR_OF_KIND',
  ALL_LETTERS: 'ALL_LETTERS',
  STRAIGHT_5: 'STRAIGHT_5',
  THREE_OF_KIND_PLUS_THREE: 'THREE_OF_KIND_PLUS_THREE',
  FULLER_HOUSE: 'FULLER_HOUSE',
  FULL_HOUSE: 'FULL_HOUSE',
  THREE_OF_KIND: 'THREE_OF_KIND',
  THREE_PAIR: 'THREE_PAIR',
  TWO_PAIR: 'TWO_PAIR',
  ALL_NUMBERS: 'ALL_NUMBERS',
  ONE_PAIR: 'ONE_PAIR',
  NO_WIN: 'NO_WIN',
};

// Returns true if d[0..6] contains a contiguous ascending OR descending
// (step +/-1) run of exactly `length` digits, matching hasSequentialRun().
function hasSequentialRun(d, length) {
  const end = 7 - length;
  for (let i = 0; i <= end; i++) {
    // ascending
    let asc = true;
    for (let j = 0; j < length - 1; j++) {
      if (d[i + j + 1] !== d[i + j] + 1) {
        asc = false;
        break;
      }
    }
    if (asc) return true;
    // descending
    let desc = true;
    for (let j = 0; j < length - 1; j++) {
      if (d[i + j + 1] !== d[i + j] - 1) {
        desc = false;
        break;
      }
    }
    if (desc) return true;
  }
  return false;
}

// Greedy skip-2 adjacency pair count, matching countConsecutivePairs().
function countConsecutivePairs(d) {
  let pairs = 0;
  let i = 0;
  while (i < 6) {
    if (d[i] === d[i + 1]) {
      pairs++;
      i += 2;
    } else {
      i++;
    }
  }
  return pairs;
}

// Classify by the EXACT priority order of detectPattern().
// d: Int array of 7 digit values (0..15).
function classify(d) {
  // counts per digit value
  const counts = new Array(16).fill(0);
  for (let i = 0; i < 7; i++) counts[d[i]]++;

  // sorted descending distribution (non-zero only)
  const dist = [];
  for (let v = 0; v < 16; v++) if (counts[v] > 0) dist.push(counts[v]);
  dist.sort((a, b) => b - a);
  const d0 = dist[0];
  const d1 = dist[1] ?? 0;
  const d2 = dist[2] ?? 0;

  // 7777777 -> value 7 repeated 7 times
  if (d0 === 7) {
    return d[0] === 7 ? T.LUCKY_SEVENS : T.ALL_SAME;
  }
  if (d0 === 6) return T.SIX_OF_KIND;
  if (hasSequentialRun(d, 7)) return T.STRAIGHT_7;
  if (d0 === 4 && d1 === 3) return T.FULLEST_HOUSE;
  if (d0 === 5) return T.FIVE_OF_KIND;
  if (hasSequentialRun(d, 6)) return T.STRAIGHT_6;
  if (d0 === 4) return T.FOUR_OF_KIND;

  // all letters: every digit value in 10..15
  let allLetters = true;
  for (let i = 0; i < 7; i++) {
    if (d[i] < 10) {
      allLetters = false;
      break;
    }
  }
  if (allLetters) return T.ALL_LETTERS;

  if (hasSequentialRun(d, 5)) return T.STRAIGHT_5;
  if (d0 === 3 && d1 === 3) return T.THREE_OF_KIND_PLUS_THREE;
  if (d0 === 3 && d1 === 2 && d2 === 2) return T.FULLER_HOUSE;
  if (d0 === 3 && d1 === 2) return T.FULL_HOUSE;
  if (d0 === 3) return T.THREE_OF_KIND;

  const pairs = countConsecutivePairs(d);
  if (pairs === 3) return T.THREE_PAIR;
  if (pairs === 2) return T.TWO_PAIR;

  // all numbers: every digit value in 0..9
  let allNumbers = true;
  for (let i = 0; i < 7; i++) {
    if (d[i] > 9) {
      allNumbers = false;
      break;
    }
  }
  if (allNumbers) return T.ALL_NUMBERS;

  if (pairs === 1) return T.ONE_PAIR;
  return T.NO_WIN;
}

const HEX = '0123456789abcdef';

// Convert a 7-hex string to digit-value array.
function toDigits(hash) {
  const d = new Array(7);
  for (let i = 0; i < 7; i++) d[i] = HEX.indexOf(hash[i]);
  return d;
}

// --- Step 1: validate fast classifier against real detectPattern ------------
async function validateAgainstDetector() {
  // Import the compiled detector from dist.
  const distUrl = new URL('../dist/patterns.js', import.meta.url);
  let detectPattern;
  try {
    ({ detectPattern } = await import(distUrl.href));
  } catch (err) {
    console.error(
      'FAIL: could not import ../dist/patterns.js. Run `pnpm build` first.'
    );
    console.error(String(err));
    process.exit(1);
  }

  const SAMPLE = 1_000_000;
  let mismatches = 0;
  const examples = [];
  // Deterministic-ish PRNG (xorshift32) so failures are reproducible.
  let state = 0x9e3779b9 >>> 0;
  const next = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    return state;
  };

  for (let n = 0; n < SAMPLE; n++) {
    // One 32-bit PRNG value yields 8 hex digits (28 bits used for 7 digits).
    let r = next();
    let hash = '';
    const d = new Array(7);
    for (let i = 0; i < 7; i++) {
      const v = r & 15;
      r >>>= 4;
      d[i] = v;
      hash += HEX[v];
    }
    const fast = classify(d);
    const real = detectPattern(hash).type;
    if (fast !== real) {
      mismatches++;
      if (examples.length < 10) examples.push({ hash, fast, real });
    }
  }

  if (mismatches > 0) {
    console.error(
      `FAIL: fast classifier disagrees with detectPattern on ${mismatches}/${SAMPLE} sampled hashes.`
    );
    for (const e of examples) {
      console.error(`  ${e.hash}: fast=${e.fast} real=${e.real}`);
    }
    process.exit(1);
  }
  console.log(
    `PASS: fast classifier matches detectPattern on ${SAMPLE.toLocaleString()} random hashes.`
  );
}

// --- Step 2: full enumeration ----------------------------------------------
function enumerate() {
  const counts = Object.create(null);
  for (const key of Object.values(T)) counts[key] = 0;

  const d = new Array(7).fill(0);
  // Iterate all 16^7 combinations using an odometer over d[0..6].
  // d[0] is the most significant; order does not affect counts.
  for (let i = 0; i < TOTAL; i++) {
    counts[classify(d)]++;

    // increment odometer
    let k = 6;
    while (k >= 0) {
      if (++d[k] < 16) break;
      d[k] = 0;
      k--;
    }
  }
  return counts;
}

// --- Main -------------------------------------------------------------------
async function main() {
  console.log('git-slot-machine :: exhaustive odds verification');
  console.log(`Total hash space: ${TOTAL.toLocaleString()} (16^7)\n`);

  await validateAgainstDetector();

  console.log('\nEnumerating all 16^7 hashes...');
  const t0 = Date.now();
  const counts = enumerate();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Enumeration complete in ${elapsed}s.\n`);

  let failures = 0;

  // Total must sum to 16^7.
  let sum = 0;
  for (const key of Object.keys(counts)) sum += counts[key];
  if (sum !== TOTAL) {
    console.error(`FAIL: counts sum to ${sum}, expected ${TOTAL}.`);
    failures++;
  } else {
    console.log(`PASS: counts sum to ${TOTAL.toLocaleString()}.`);
  }

  // Per-pattern NET counts must match patterns.json exactly.
  console.log('\nPer-pattern NET counts:');
  console.log(
    '  type'.padEnd(30) +
      'enumerated'.padStart(14) +
      'expected'.padStart(14) +
      '  ok'
  );
  for (const p of ruleset.patterns) {
    const got = counts[p.type] ?? 0;
    const ok = got === p.net;
    if (!ok) failures++;
    console.log(
      `  ${p.type.padEnd(28)}${String(got).padStart(14)}${String(p.net).padStart(
        14
      )}  ${ok ? 'ok' : 'MISMATCH'}`
    );
  }

  // RTP = sum(payout * net) / 16^7 / cost, within [1.05, 1.10] and matching json.
  let weighted = 0;
  for (const p of ruleset.patterns) {
    weighted += p.payout * (counts[p.type] ?? 0);
  }
  const rtp = weighted / TOTAL / COST;

  console.log('');
  if (rtp < 1.05 || rtp > 1.1) {
    console.error(`FAIL: RTP ${rtp} is outside [1.05, 1.10].`);
    failures++;
  } else {
    console.log(`PASS: RTP ${rtp} is within [1.05, 1.10].`);
  }

  if (Math.abs(rtp - ruleset.rtp) > 1e-6) {
    console.error(
      `FAIL: RTP ${rtp} differs from patterns.json rtp ${ruleset.rtp} by more than 1e-6.`
    );
    failures++;
  } else {
    console.log(`PASS: RTP matches patterns.json rtp (${ruleset.rtp}).`);
  }

  console.log('\n' + '='.repeat(60));
  if (failures === 0) {
    console.log(
      `SUMMARY: PASS — all ${ruleset.patterns.length} NET counts match, total=${TOTAL.toLocaleString()}, RTP=${rtp.toFixed(
        10
      )}.`
    );
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.error(`SUMMARY: FAIL — ${failures} check(s) failed.`);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FAIL: unexpected error');
  console.error(err);
  process.exit(1);
});
