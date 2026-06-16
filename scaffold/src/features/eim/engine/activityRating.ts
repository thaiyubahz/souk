/**
 * "Rate My Activity" — simulator-only behavioural + composition rating.
 *
 * Pure, deterministic, frontend-only — no LLM, no backend, no dependency.
 * Same portfolio in → same rating out. This is the lightweight, instant
 * cousin of EIM Mirror (`eim_mirror_*`): where the Mirror runs 10 closed-
 * form bias detectors + muhasaba framing + an LLM narrative over a real
 * broker tradebook, this scores the free-tier sandbox portfolio into a
 * single friendly grade + six easy-to-read sub-scores. Light Islamic
 * framing (sabr / niyyah / ihsan), never the full muhasaba apparatus.
 *
 * Design notes:
 *   - Everything is computed from data already in `eim.store` (positions,
 *     cash, the transaction journal). No network call is required for the
 *     five core metrics, so the rating paints instantly.
 *   - "halal mix" is the one metric that needs external Shariah data. The
 *     engine accepts an optional `shariahByTicker` map (built by the caller
 *     from already-cached snapshots / curated assets) and degrades to a
 *     `na` band when coverage is too thin to be honest about.
 *   - Each metric self-reports a `band` of `na` when there isn't enough
 *     signal to judge it (e.g. win-rate with < 3 closed trades, or cash
 *     deployment on a portfolio whose ledger was never populated). `na`
 *     metrics are excluded from the overall grade rather than scored 0 —
 *     we never punish a user for data we don't have.
 *
 * `lessonId` values map onto seeded lesson ids in `eim_seed_lessons.py`
 * (`diversification_strategy`, `long_term_compounding`, …) so the card can
 * deep-link "tap to learn" into `/eim/lesson/:lessonId`.
 */

import type { Portfolio } from '../types/eim.types';
import { computeHoldings } from './holdings';

// ── Public types ────────────────────────────────────────────────────────────

export type RatingBand = 'poor' | 'fair' | 'good' | 'strong' | 'na';

export type MetricId =
  | 'patience'
  | 'intention'
  | 'decisions'
  | 'diversification'
  | 'cash_use'
  | 'halal_mix';

export type MetricSection = 'activity' | 'holdings';

/** A simple pass/borderline/concern Shariah verdict per ticker, derived by
 *  the caller from a `TripleShariah.composite` (0–100). `unknown` means we
 *  have no compliance data for that ticker. */
export type ShariahVerdict = 'pass' | 'borderline' | 'concern' | 'unknown';

export interface RatedMetric {
  id: MetricId;
  label: string;
  section: MetricSection;
  /** Light Islamic concept tag (transliteration), e.g. "Sabr". Optional. */
  concept?: string;
  /** Arabic for the concept tag, e.g. "صبر". Optional. */
  conceptAr?: string;
  /** 0–100, or null when the metric is `na`. */
  score: number | null;
  band: RatingBand;
  /** 0–5 filled dots for the bar (0 only when `na`). */
  pips: number;
  /** One short human-readable line describing the current value. */
  detail: string;
  /** One actionable, encouraging suggestion. */
  tip: string;
  /** Seeded lesson id for "tap to learn". */
  lessonId?: string;
}

export interface ActivityRating {
  /** True only when at least one metric could be scored. */
  hasEnoughData: boolean;
  /** Weighted-equal mean of all non-`na` metric scores (0–100). 0 when none. */
  overallScore: number;
  /** Letter grade derived from `overallScore` ("A+" … "D"), or "—" when na. */
  grade: string;
  /** Friendly persona label, e.g. "Steady Steward". */
  archetype: string;
  /** One-line summary keyed off the strongest + weakest rated metric. */
  headline: string;
  /** All six metrics in display order (activity first, then holdings). */
  metrics: RatedMetric[];
  /** BUY + SELL + DCA_BUY count — used for empty-state copy. */
  tradeCount: number;
}

// ── Tuning constants ──────────────────────────────────────────────────────
// Conservative, documented thresholds so a reviewer can audit every cut.
// Mirrors the spirit of patternDetection.ts / the Mirror detector bands.

const DAY_MS = 86_400_000;
/** A holding "passes" Shariah when its triple-standard composite ≥ this.
 *  Matches the green-leaning band used by the TripleShariahRings UI. */
export const SHARIAH_PASS_COMPOSITE = 60;
/** Below `pass` but above this → "borderline"; below this → "concern". */
export const SHARIAH_BORDERLINE_COMPOSITE = 45;
/** Need this fraction of holdings to have compliance data before we rate
 *  "halal mix" at all — otherwise the number would be misleading. */
const HALAL_MIN_COVERAGE = 0.5;
/** Win-rate needs at least this many closed (SELL) trades to mean anything. */
const MIN_CLOSED_TRADES_FOR_WINRATE = 3;

// ── Band / pip / grade helpers ──────────────────────────────────────────────

function bandFromScore(score: number): Exclude<RatingBand, 'na'> {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function pipsFromScore(score: number): number {
  return Math.min(5, Math.max(1, Math.round(score / 20)));
}

function gradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 82) return 'A';
  if (score >= 74) return 'B+';
  if (score >= 66) return 'B';
  if (score >= 58) return 'C+';
  if (score >= 50) return 'C';
  return 'D';
}

/** Build a rated (non-na) metric from a 0–100 score. */
function rate(
  base: Omit<RatedMetric, 'band' | 'pips' | 'score'> & { score: number },
): RatedMetric {
  const score = Math.round(Math.min(100, Math.max(0, base.score)));
  return { ...base, score, band: bandFromScore(score), pips: pipsFromScore(score) };
}

/** Build a `na` metric (insufficient data) with explanatory copy. */
function naMetric(
  base: Omit<RatedMetric, 'band' | 'pips' | 'score' | 'tip'> & { tip: string },
): RatedMetric {
  return { ...base, score: null, band: 'na', pips: 0 };
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ── The engine ────────────────────────────────────────────────────────────

export interface RateActivityOptions {
  /** Per-ticker Shariah verdict (caller derives from cached snapshots /
   *  curated assets). Tickers absent from the map are treated as `unknown`. */
  shariahByTicker?: Record<string, ShariahVerdict>;
  /** Injectable "now" for deterministic tests. Defaults to the current time. */
  now?: Date;
}

export function rateActivity(
  portfolio: Portfolio,
  opts: RateActivityOptions = {},
): ActivityRating {
  const now = opts.now ?? new Date();
  const shariah = opts.shariahByTicker ?? {};

  const positions = portfolio.positions ?? [];
  const txns = portfolio.transactions ?? [];
  const buys = txns.filter((t) => t.kind === 'BUY' || t.kind === 'DCA_BUY');
  const sells = txns.filter((t) => t.kind === 'SELL');
  const tradeCount = buys.length + sells.length;
  const holdings = computeHoldings(portfolio);

  const metrics: RatedMetric[] = [
    scorePatience(positions, sells.length, buys.length, now),
    scoreIntention(buys, sells),
    scoreDecisions(sells),
    scoreDiversification(holdings),
    scoreCashUse(portfolio, holdings, txns.length),
    scoreHalalMix(holdings, shariah),
  ];

  const rated = metrics.filter((m) => m.band !== 'na' && m.score != null);
  const hasEnoughData = rated.length > 0;
  const overallScore = hasEnoughData
    ? Math.round(rated.reduce((s, m) => s + (m.score as number), 0) / rated.length)
    : 0;

  return {
    hasEnoughData,
    overallScore,
    grade: hasEnoughData ? gradeFromScore(overallScore) : '—',
    archetype: pickArchetype(hasEnoughData, overallScore, metrics),
    headline: buildHeadline(hasEnoughData, rated),
    metrics,
    tradeCount,
  };
}

// ── Activity metrics ────────────────────────────────────────────────────────

/** Patience (sabr): blends how long positions are held with how much the
 *  user churns. Long holds + few sells relative to buys → patient. */
function scorePatience(
  positions: Portfolio['positions'],
  sellCount: number,
  buyCount: number,
  now: Date,
): RatedMetric {
  const base = {
    id: 'patience' as const,
    label: 'Patience',
    section: 'activity' as const,
    concept: 'Sabr',
    conceptAr: 'صبر',
    lessonId: 'long_term_compounding',
  };

  if (positions.length === 0 && sellCount === 0) {
    return naMetric({
      ...base,
      detail: 'No positions held yet.',
      tip: 'Open a position to start building a track record.',
    });
  }

  // Average holding age of currently-open positions, in days.
  const ages = positions
    .map((p) => (now.getTime() - new Date(p.buy_date).getTime()) / DAY_MS)
    .filter((d) => isFinite(d) && d >= 0);
  const avgHoldDays = ages.length ? ages.reduce((s, d) => s + d, 0) / ages.length : 0;

  // Hold-duration score.
  let score: number;
  if (avgHoldDays >= 365) score = 100;
  else if (avgHoldDays >= 180) score = 85;
  else if (avgHoldDays >= 90) score = 70;
  else if (avgHoldDays >= 30) score = 52;
  else if (avgHoldDays >= 7) score = 38;
  else score = 24;

  // Churn penalty — selling far more often than buying signals flipping.
  const sellRatio = buyCount > 0 ? sellCount / buyCount : 0;
  if (sellRatio > 1.0) score -= 20;
  else if (sellRatio > 0.5) score -= 10;

  const holdLabel =
    avgHoldDays >= 30
      ? `~${Math.round(avgHoldDays / 30)} mo avg hold`
      : `~${Math.round(avgHoldDays)}d avg hold`;
  const tip =
    score >= 70
      ? 'Strong hold discipline — patience is how compounding does its work.'
      : 'Give your positions room to breathe; frequent flipping rarely beats a patient hand.';

  return rate({ ...base, score, detail: holdLabel, tip });
}

/** Intention (niyyah): did the user record *why* on their trades? Rewards
 *  the reflection-note habit the simulator journal is built to cultivate. */
function scoreIntention(
  buys: Portfolio['transactions'],
  sells: Portfolio['transactions'],
): RatedMetric {
  const base = {
    id: 'intention' as const,
    label: 'Clear intention',
    section: 'activity' as const,
    concept: 'Niyyah',
    conceptAr: 'نية',
    lessonId: 'maqasid_wealth',
  };
  const trades = [...buys, ...sells];
  if (trades.length === 0) {
    return naMetric({
      ...base,
      detail: 'No journalled trades yet.',
      tip: "Add a 'why' note when you trade — naming your intention sharpens it.",
    });
  }
  const noted = trades.filter((t) => (t.reflection_note ?? '').trim().length > 0).length;
  const ratio = noted / trades.length;
  const score = ratio * 100;
  const tip =
    ratio >= 0.7
      ? 'You name your reasons before you act — that is the muhasaba habit.'
      : "Jot a short 'why' on each trade; reasons written down are reasons you can review.";
  return rate({
    ...base,
    score,
    detail: `${noted}/${trades.length} trades have a 'why' note`,
    tip,
  });
}

/** Decisions (ihsan): realised win-rate across closed (SELL) trades. Only
 *  meaningful once a few round-trips exist. */
function scoreDecisions(sells: Portfolio['transactions']): RatedMetric {
  const base = {
    id: 'decisions' as const,
    label: 'Decisions',
    section: 'activity' as const,
    concept: 'Ihsan',
    conceptAr: 'إحسان',
    lessonId: 'behavioral_finance_tawakkul',
  };
  if (sells.length < MIN_CLOSED_TRADES_FOR_WINRATE) {
    return naMetric({
      ...base,
      detail:
        sells.length === 0
          ? 'No closed trades yet.'
          : `${sells.length} closed trade${sells.length === 1 ? '' : 's'} — need a few more to rate.`,
      tip: 'Close a few round-trips and we can reflect on your hit-rate honestly.',
    });
  }
  const wins = sells.filter((t) => t.realized_pnl > 0).length;
  const winRate = wins / sells.length;
  // Map win-rate to a score with a gentle curve — even good investors are
  // wrong often; ~55% closed wins is already healthy.
  const score = Math.min(100, winRate * 130);
  const tip =
    winRate >= 0.5
      ? 'More closes in the green than red — keep letting winners run.'
      : 'Outcomes are not all in your control; judge the decision, not just the result.';
  return rate({
    ...base,
    score,
    detail: `${wins}/${sells.length} closed trades profitable (${pct(winRate)})`,
    tip,
  });
}

// ── Holdings metrics ──────────────────────────────────────────────────────

/** Diversification: breadth (distinct names) blended with balance (how much
 *  the single largest holding dominates, by cost basis). */
function scoreDiversification(
  holdings: ReturnType<typeof computeHoldings>,
): RatedMetric {
  const base = {
    id: 'diversification' as const,
    label: 'Diversification',
    section: 'holdings' as const,
    lessonId: 'diversification_strategy',
  };
  if (holdings.length === 0) {
    return naMetric({
      ...base,
      detail: 'Nothing held yet.',
      tip: 'Add a few positions across different names to spread your risk.',
    });
  }

  const costs = holdings.map((h) => h.total_qty * h.avg_cost);
  const invested = costs.reduce((s, c) => s + c, 0) || 1;
  const topWeight = Math.max(...costs) / invested;

  const distinct = holdings.length;
  let breadth: number;
  if (distinct >= 6) breadth = 100;
  else if (distinct === 5) breadth = 90;
  else if (distinct === 4) breadth = 78;
  else if (distinct === 3) breadth = 62;
  else if (distinct === 2) breadth = 44;
  else breadth = 22;

  let balance: number;
  if (topWeight <= 0.3) balance = 100;
  else if (topWeight <= 0.45) balance = 80;
  else if (topWeight <= 0.6) balance = 58;
  else if (topWeight <= 0.8) balance = 36;
  else balance = 18;

  const score = 0.5 * breadth + 0.5 * balance;
  const tip =
    distinct < 3
      ? 'Hold a few more names across different sectors — one stumble shouldn’t sink you.'
      : topWeight > 0.5
        ? `Your largest position is ${pct(topWeight)} of the book — consider trimming to balance it.`
        : 'Nicely spread — no single name can dominate your outcome.';
  return rate({
    ...base,
    score,
    detail: `${distinct} holding${distinct === 1 ? '' : 's'} · largest is ${pct(topWeight)} of the book`,
    tip,
  });
}

/** Cash use: how much capital is actually put to work vs. sitting idle.
 *  Only rated when the ledger is meaningful (≥ 1 transaction) — wizard-only
 *  watchlist portfolios don't debit cash, so their balance isn't authoritative. */
function scoreCashUse(
  portfolio: Portfolio,
  holdings: ReturnType<typeof computeHoldings>,
  txnCount: number,
): RatedMetric {
  const base = {
    id: 'cash_use' as const,
    label: 'Cash use',
    section: 'holdings' as const,
    lessonId: 'dca_vs_lumpsum',
  };
  if (txnCount === 0) {
    return naMetric({
      ...base,
      detail: 'No cash ledger yet.',
      tip: 'Use Buy / Sell so your cash balance reflects real decisions.',
    });
  }

  const invested = holdings.reduce((s, h) => s + h.total_qty * h.avg_cost, 0);
  const cash = Math.max(0, portfolio.cash_balance ?? 0);
  const total = invested + cash || 1;
  const deployed = invested / total;

  // Healthy band: mostly invested while keeping a modest buffer.
  let score: number;
  if (deployed >= 0.6 && deployed <= 0.95) score = 95;
  else if (deployed > 0.95) score = 78; // fully deployed, no dry powder
  else if (deployed >= 0.4) score = 70;
  else if (deployed >= 0.2) score = 50;
  else score = 28; // mostly idle cash

  const tip =
    deployed < 0.4
      ? 'A lot of cash is sitting idle — put more to work, or keep it as a deliberate buffer.'
      : deployed > 0.95
        ? 'Fully invested — a small cash buffer gives you room to act on opportunities.'
        : 'Good balance of invested capital and a cash cushion.';
  return rate({
    ...base,
    score,
    detail: `${pct(deployed)} invested · ${pct(1 - deployed)} in cash`,
    tip,
  });
}

/** Halal mix: share of holdings that pass the triple-standard Shariah screen.
 *  `na` when fewer than half the holdings have compliance data. */
function scoreHalalMix(
  holdings: ReturnType<typeof computeHoldings>,
  shariahByTicker: Record<string, ShariahVerdict>,
): RatedMetric {
  const base = {
    id: 'halal_mix' as const,
    label: 'Halal mix',
    section: 'holdings' as const,
    lessonId: 'triple_shariah_screening',
  };
  if (holdings.length === 0) {
    return naMetric({
      ...base,
      detail: 'Nothing held yet.',
      tip: 'Screen each name before you buy — compliance is part of the return.',
    });
  }

  const known = holdings.filter(
    (h) => (shariahByTicker[h.ticker] ?? 'unknown') !== 'unknown',
  );
  const coverage = known.length / holdings.length;
  if (coverage < HALAL_MIN_COVERAGE) {
    return naMetric({
      ...base,
      detail: `Compliance data for ${known.length}/${holdings.length} holdings.`,
      tip: 'Open each holding’s Shariah screen so we can rate the whole book.',
    });
  }

  const pass = known.filter((h) => shariahByTicker[h.ticker] === 'pass').length;
  const concern = known.filter((h) => shariahByTicker[h.ticker] === 'concern').length;
  const ratio = pass / known.length;
  // Each clear-concern holding drags the score harder than a mere miss.
  const score = Math.max(0, ratio * 100 - concern * 12);
  const unscreened = holdings.length - known.length;
  const tip =
    concern > 0
      ? `${concern} holding${concern === 1 ? '' : 's'} raise${concern === 1 ? 's' : ''} compliance concerns — review or purify.`
      : unscreened > 0
        ? `Couldn’t screen ${unscreened} of your ${holdings.length} holdings — open them to check compliance.`
        : ratio >= 0.9
          ? 'Your book screens clean across the triple standard, ma sha Allah.'
          : 'Mostly compliant — tighten the borderline names when you can.';
  return rate({
    ...base,
    score,
    // Be explicit about partial coverage so a screened subset never reads as
    // if holdings disappeared (e.g. "2/2 pass" when the user holds 4).
    detail:
      unscreened > 0
        ? `${pass}/${known.length} screened pass · ${unscreened} not screened`
        : `${pass}/${holdings.length} holdings pass`,
    tip,
  });
}

// ── Archetype + headline ────────────────────────────────────────────────────

function pickArchetype(
  hasEnoughData: boolean,
  overall: number,
  metrics: RatedMetric[],
): string {
  if (!hasEnoughData) return 'Just Getting Started';
  const by = (id: MetricId) => metrics.find((m) => m.id === id);
  const patience = by('patience');
  const diversification = by('diversification');

  // A couple of character overrides before falling back to the overall band.
  if (patience?.band !== 'na' && (patience?.score ?? 100) < 40) return 'Restless Trader';
  if (
    diversification?.band !== 'na' &&
    (diversification?.score ?? 100) < 35
  )
    return 'All-In Conviction';

  if (overall >= 80) return 'Steady Steward';
  if (overall >= 65) return 'Balanced Builder';
  if (overall >= 50) return 'Learning the Ropes';
  return 'Early Days';
}

function buildHeadline(hasEnoughData: boolean, rated: RatedMetric[]): string {
  if (!hasEnoughData) {
    return 'Add a position or two and come back — we’ll rate how you’re building.';
  }
  const sorted = [...rated].sort((a, b) => (b.score as number) - (a.score as number));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (sorted.length === 1 || best.id === worst.id) {
    return `${best.label} is your standout so far.`;
  }
  return `${best.label} is your strength — your next step is ${worst.label.toLowerCase()}.`;
}
