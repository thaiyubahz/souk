/**
 * Pattern-detection unit tests (EIM Pattern Spotting).
 *
 * Two layers, kept separate on purpose:
 *   1. SHAPE detection — does the geometry/context recognise each pattern? These
 *      run in LENIENT mode (no confirmation, all confidences, indecision on) so
 *      they isolate the detector logic from the precision gate.
 *   2. PRECISION GATE (the strict defaults, 2026-06-05) — strong-only + next-bar
 *      confirmation for 1–2 candle reversals + no lone indecision. This is what
 *      live charts use: it must never surface an unconfirmed/weak pattern.
 *
 * Lead-in bars are deliberately "gentle" (small bodies) so they establish a
 * trend without themselves tripping the strong-body soldier/crow detectors.
 */

import { describe, expect, it } from 'vitest';
import { detectPatterns, dedupeOverlaps } from '../patternDetection';
import type { MonthlyOhlcBar } from '../../types/eim.types';

// [open, high, low, close]
type Row = [number, number, number, number];

function build(rows: Row[]): MonthlyOhlcBar[] {
  return rows.map(([open, high, low, close], i) => ({
    time: `2010-${String((i % 12) + 1).padStart(2, '0')}-01`,
    open,
    high,
    low,
    close,
  }));
}

// Lenient = the old "recognise the shape" behaviour, used to test detectors
// in isolation from the precision gate.
const LENIENT = { strongOnly: false, requireConfirmation: false, includeIndecision: true } as const;
const idsLenient = (rows: Row[]) => detectPatterns(build(rows), LENIENT).map((p) => p.patternId);
// Strict = production defaults.
const idsStrict = (rows: Row[]) => detectPatterns(build(rows)).map((p) => p.patternId);

// Gentle trend lead-ins (small bodies, no special shape) ending at close 100.
const gentleBear = (c: number): Row => [c + 0.6, c + 1.1, c - 0.5, c];
const gentleBull = (c: number): Row => [c - 0.6, c + 0.5, c - 1.1, c];
// 5% trend bar is the new minimum, so spread the lead-ins wider than before.
const DOWN_LEAD: Row[] = [115, 111, 108, 104, 100].map(gentleBear);
const UP_LEAD: Row[] = [87, 91, 94, 97, 100].map(gentleBull);

// A canonical hammer/hanging-man SHAPE: small body up top, long lower wick.
const LOWER_WICK_SHAPE: Row = [100.5, 101.8, 94, 101.5];
// A shooting-star/inverted-hammer SHAPE: small body down low, long upper wick.
const UPPER_WICK_SHAPE: Row = [100, 106, 98.5, 99];

// Confirming bars (next month agrees with the reversal direction).
const CONFIRM_UP: Row = [101.5, 104, 101.2, 103.5]; // close above the wick-shape close (101.5)
const CONFIRM_UP_FROM_99: Row = [99, 102, 98.8, 101.5]; // close above the upper-wick close (99)
const CONFIRM_DOWN_FROM_99: Row = [99, 99.3, 96, 96.5]; // close below the upper-wick close (99)

describe('detectPatterns — guards', () => {
  it('returns [] for a series shorter than lookback + 2', () => {
    expect(detectPatterns(build([gentleBear(100), gentleBear(99)]))).toEqual([]);
  });

  it('ignores degenerate flat bars (high === low) without throwing', () => {
    const flat: Row = [100, 100, 100, 100];
    expect(() => detectPatterns(build([...DOWN_LEAD, flat]))).not.toThrow();
  });
});

describe('detectPatterns — single candle shape + context (lenient)', () => {
  it('long lower wick after a DOWNtrend → hammer (not hanging man)', () => {
    const got = idsLenient([...DOWN_LEAD, LOWER_WICK_SHAPE]);
    expect(got).toContain('hammer');
    expect(got).not.toContain('hanging_man');
  });

  it('the SAME shape after an UPtrend → hanging man (not hammer)', () => {
    const got = idsLenient([...UP_LEAD, LOWER_WICK_SHAPE]);
    expect(got).toContain('hanging_man');
    expect(got).not.toContain('hammer');
  });

  it('long upper wick after an UPtrend → shooting star', () => {
    expect(idsLenient([...UP_LEAD, UPPER_WICK_SHAPE])).toContain('shooting_star');
  });

  it('long upper wick after a DOWNtrend → inverted hammer', () => {
    expect(idsLenient([...DOWN_LEAD, UPPER_WICK_SHAPE])).toContain('inverted_hammer');
  });

  it('doji at a trend extreme is graded strong', () => {
    const doji: Row = [100, 103, 97, 100.05];
    const det = detectPatterns(build([...DOWN_LEAD, doji]), LENIENT).find((p) => p.patternId === 'doji');
    expect(det).toBeDefined();
    expect(det!.signal).toBe('indecision');
    expect(det!.confidence).toBe('strong');
  });
});

describe('detectPatterns — two candle shape (lenient)', () => {
  it('bullish engulfing after a downtrend', () => {
    const smallBear: Row = [101, 101.5, 97.5, 98];
    const bigBull: Row = [97, 103.5, 96.5, 103];
    expect(idsLenient([...DOWN_LEAD, smallBear, bigBull])).toContain('bullish_engulfing');
  });

  it('bearish engulfing after an uptrend', () => {
    const smallBull: Row = [100, 103.5, 99.5, 103];
    const bigBear: Row = [104, 104.5, 97.5, 98];
    expect(idsLenient([...UP_LEAD, smallBull, bigBear])).toContain('bearish_engulfing');
  });

  it('bullish harami after a downtrend (small body inside the prior big red)', () => {
    const bigBear: Row = [108, 108.5, 97.5, 98];
    const smallInside: Row = [102, 104.5, 101.5, 104];
    expect(idsLenient([...DOWN_LEAD, bigBear, smallInside])).toContain('bullish_harami');
  });

  it('bearish harami after an uptrend', () => {
    const bigBull: Row = [92, 102.5, 91.5, 102];
    const smallInside: Row = [98, 98.5, 95.5, 96];
    expect(idsLenient([...UP_LEAD, bigBull, smallInside])).toContain('bearish_harami');
  });
});

describe('detectPatterns — three candle shape (lenient)', () => {
  it('morning star after a downtrend (moderate confidence)', () => {
    const bigBear: Row = [106, 106.5, 97.5, 98];
    const star: Row = [96, 97, 93, 96.5];
    const bigBull: Row = [97, 103.5, 96.5, 103];
    const det = detectPatterns(build([...DOWN_LEAD, bigBear, star, bigBull]), LENIENT).find(
      (p) => p.patternId === 'morning_star',
    );
    expect(det).toBeDefined();
    expect(det!.confidence).toBe('moderate');
  });

  it('evening star after an uptrend', () => {
    const bigBull: Row = [98, 108.5, 97.5, 108];
    const star: Row = [110, 111, 109, 110.5];
    const bigBear: Row = [109, 109.5, 100.5, 101];
    expect(idsLenient([...UP_LEAD, bigBull, star, bigBear])).toContain('evening_star');
  });

  it('three white soldiers', () => {
    const s1: Row = [101, 107.5, 100.5, 107];
    const s2: Row = [104, 112.5, 103.5, 112];
    const s3: Row = [109, 118.5, 108.5, 118];
    const det = detectPatterns(build([...DOWN_LEAD, s1, s2, s3]), LENIENT).find(
      (p) => p.patternId === 'three_white_soldiers',
    );
    expect(det).toBeDefined();
    expect(det!.confidence).toBe('strong');
  });

  it('three black crows', () => {
    const c1: Row = [99, 99.5, 92.5, 93];
    const c2: Row = [96, 96.5, 87.5, 88];
    const c3: Row = [91, 91.5, 82.5, 83];
    expect(idsLenient([...UP_LEAD, c1, c2, c3])).toContain('three_black_crows');
  });
});

describe('precision gate — strict defaults (live spotting)', () => {
  it('does NOT surface a reversal that the next month has not confirmed', () => {
    // Hammer as the latest bar — no confirming month yet.
    expect(idsStrict([...DOWN_LEAD, LOWER_WICK_SHAPE])).not.toContain('hammer');
  });

  it('surfaces a hammer once the next month confirms it (closes higher)', () => {
    expect(idsStrict([...DOWN_LEAD, LOWER_WICK_SHAPE, CONFIRM_UP])).toContain('hammer');
  });

  it('does NOT surface a hammer when the next month contradicts it (closes lower)', () => {
    const contradict: Row = [101.5, 101.8, 99, 99.5];
    expect(idsStrict([...DOWN_LEAD, LOWER_WICK_SHAPE, contradict])).not.toContain('hammer');
  });

  it('confirms a shooting star only on a lower next close, not a higher one', () => {
    expect(idsStrict([...UP_LEAD, UPPER_WICK_SHAPE, CONFIRM_DOWN_FROM_99])).toContain('shooting_star');
    expect(idsStrict([...UP_LEAD, UPPER_WICK_SHAPE, CONFIRM_UP_FROM_99])).not.toContain('shooting_star');
  });

  it('drops moderate-grade patterns (harami) entirely', () => {
    const bigBear: Row = [108, 108.5, 97.5, 98];
    const smallInside: Row = [102, 104.5, 101.5, 104];
    const confirm: Row = [104, 107, 103.5, 106.5];
    // Lenient sees it; strict (strong-only) does not.
    expect(idsLenient([...DOWN_LEAD, bigBear, smallInside])).toContain('bullish_harami');
    expect(idsStrict([...DOWN_LEAD, bigBear, smallInside, confirm])).not.toContain('bullish_harami');
  });

  it('drops lone indecision (doji) from live spotting', () => {
    const doji: Row = [100, 103, 97, 100.05];
    const confirm: Row = [100, 102, 99.5, 101.5];
    expect(idsStrict([...DOWN_LEAD, doji, confirm])).not.toContain('doji');
  });

  it('treats three white soldiers as self-confirming (no 4th bar needed)', () => {
    const s1: Row = [101, 107.5, 100.5, 107];
    const s2: Row = [104, 112.5, 103.5, 112];
    const s3: Row = [109, 118.5, 108.5, 118];
    expect(idsStrict([...DOWN_LEAD, s1, s2, s3])).toContain('three_white_soldiers');
  });
});

describe('detectPatterns — negative / honesty', () => {
  it('a flat series does NOT emit trend-dependent reversals', () => {
    const flatBull = (c: number): Row => [c - 0.15, c + 0.25, c - 0.55, c + 0.15];
    const FLAT_LEAD: Row[] = [100, 100, 100, 100, 100].map(flatBull);
    const got = idsLenient([...FLAT_LEAD, LOWER_WICK_SHAPE]);
    expect(got).not.toContain('hammer');
    expect(got).not.toContain('hanging_man');
  });
});

describe('dedupeOverlaps', () => {
  it('keeps the higher-candle-count pattern when ranges overlap', () => {
    const overlapping = [
      { patternId: 'hammer', startIndex: 7, endIndex: 7, signal: 'bullish_reversal', confidence: 'strong' },
      { patternId: 'morning_star', startIndex: 5, endIndex: 7, signal: 'bullish_reversal', confidence: 'moderate' },
    ] as const;
    const kept = dedupeOverlaps([...overlapping]);
    expect(kept).toHaveLength(1);
    expect(kept[0].patternId).toBe('morning_star');
  });
});
