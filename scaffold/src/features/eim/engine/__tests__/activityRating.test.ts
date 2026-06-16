/**
 * "Rate My Activity" engine — pure logic tests.
 *
 * Deterministic by construction: every case injects a fixed `now` so the
 * holding-age maths can't drift. Mirrors the band-cut rationale documented
 * in `activityRating.ts`.
 */

import { describe, expect, it } from 'vitest';
import {
  rateActivity,
  type MetricId,
  type ShariahVerdict,
} from '../activityRating';
import type { Portfolio, Position, SimTransaction } from '../../types/eim.types';

const NOW = new Date('2026-06-08T00:00:00Z');

function pos(p: { ticker: string; qty: number; buy_price: number; buy_date: string }): Position {
  return {
    id: `pos_${p.ticker}_${p.buy_date}`,
    portfolio_id: 'pf_test',
    ticker: p.ticker,
    qty: p.qty,
    buy_price: p.buy_price,
    buy_date: p.buy_date,
    tier: 'free',
  };
}

function txn(t: Partial<SimTransaction> & { kind: SimTransaction['kind'] }): SimTransaction {
  return {
    id: `txn_${Math.round((t.cash_after ?? 0) + (t.qty ?? 0))}_${t.kind}_${t.timestamp ?? ''}`,
    portfolio_id: 'pf_test',
    kind: t.kind,
    ticker: t.ticker ?? null,
    qty: t.qty ?? 0,
    price: t.price ?? 0,
    realized_pnl: t.realized_pnl ?? 0,
    cash_delta: t.cash_delta ?? 0,
    cash_after: t.cash_after ?? 0,
    fx_rate: t.fx_rate ?? 1,
    timestamp: t.timestamp ?? '2026-01-01T00:00:00Z',
    reflection_note: t.reflection_note ?? '',
    tier: 'free',
  };
}

function portfolio(over: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'pf_test',
    user_id: 'u_test',
    name: 'Test',
    created_at: '2026-01-01T00:00:00Z',
    positions: [],
    tier: 'free',
    cash_balance: 10_000,
    currency: 'USD',
    transactions: [],
    ...over,
  };
}

function metric(r: ReturnType<typeof rateActivity>, id: MetricId) {
  const m = r.metrics.find((x) => x.id === id);
  if (!m) throw new Error(`metric ${id} missing`);
  return m;
}

describe('rateActivity — empty portfolio', () => {
  it('reports no data and an inviting headline', () => {
    const r = rateActivity(portfolio(), { now: NOW });
    expect(r.hasEnoughData).toBe(false);
    expect(r.grade).toBe('—');
    expect(r.archetype).toBe('Just Getting Started');
    expect(r.overallScore).toBe(0);
    // Every metric should be `na` with zero pips.
    for (const m of r.metrics) {
      expect(m.band).toBe('na');
      expect(m.pips).toBe(0);
      expect(m.score).toBeNull();
    }
  });
});

describe('rateActivity — wizard-only portfolio (positions, no ledger)', () => {
  // The legacy add-position wizard appends raw lots without transactions.
  const p = portfolio({
    positions: [
      pos({ ticker: 'AAPL', qty: 10, buy_price: 100, buy_date: '2024-01-01' }),
      pos({ ticker: 'MSFT', qty: 5, buy_price: 200, buy_date: '2024-06-01' }),
      pos({ ticker: 'NVDA', qty: 2, buy_price: 500, buy_date: '2025-01-01' }),
    ],
  });

  it('rates composition + patience, but na for ledger-dependent metrics', () => {
    const r = rateActivity(p, { now: NOW });
    expect(r.hasEnoughData).toBe(true);
    expect(metric(r, 'diversification').band).not.toBe('na');
    expect(metric(r, 'patience').band).not.toBe('na'); // uses buy_date age
    // No transactions → these can't be judged honestly.
    expect(metric(r, 'intention').band).toBe('na');
    expect(metric(r, 'decisions').band).toBe('na');
    expect(metric(r, 'cash_use').band).toBe('na');
  });

  it('long holds score patience as strong', () => {
    const r = rateActivity(p, { now: NOW });
    // Avg hold spans ~1.5–2.4 yrs → all ≥ 365d → strong.
    expect(metric(r, 'patience').band).toBe('strong');
  });

  it('three balanced names score diversification well', () => {
    const r = rateActivity(p, { now: NOW });
    const div = metric(r, 'diversification');
    expect(['good', 'strong']).toContain(div.band);
  });
});

describe('rateActivity — concentration penalty', () => {
  it('a single dominant holding drags diversification down', () => {
    const p = portfolio({
      positions: [
        pos({ ticker: 'TSLA', qty: 100, buy_price: 200, buy_date: '2025-01-01' }), // 20,000
        pos({ ticker: 'AAPL', qty: 1, buy_price: 100, buy_date: '2025-01-01' }), //    100
      ],
    });
    const r = rateActivity(p, { now: NOW });
    const div = metric(r, 'diversification');
    expect(div.detail).toContain('largest is 100%');
    expect(['poor', 'fair']).toContain(div.band);
    expect(r.archetype).toBe('All-In Conviction');
  });
});

describe('rateActivity — intention (niyyah)', () => {
  it('scores the fraction of journalled trades', () => {
    const p = portfolio({
      positions: [pos({ ticker: 'AAPL', qty: 10, buy_price: 100, buy_date: '2026-05-01' })],
      transactions: [
        txn({ kind: 'BUY', ticker: 'AAPL', qty: 10, reflection_note: 'long-term hold thesis' }),
        txn({ kind: 'BUY', ticker: 'AAPL', qty: 5, reflection_note: '' }),
      ],
    });
    const r = rateActivity(p, { now: NOW });
    const intent = metric(r, 'intention');
    expect(intent.band).not.toBe('na');
    expect(intent.score).toBe(50); // 1 of 2 noted
    expect(intent.detail).toContain("1/2");
  });
});

describe('rateActivity — decisions (win rate)', () => {
  it('na until at least three closed trades', () => {
    const p = portfolio({
      transactions: [
        txn({ kind: 'SELL', ticker: 'AAPL', realized_pnl: 50 }),
        txn({ kind: 'SELL', ticker: 'MSFT', realized_pnl: -20 }),
      ],
    });
    expect(metric(rateActivity(p, { now: NOW }), 'decisions').band).toBe('na');
  });

  it('scores win-rate once enough closed trades exist', () => {
    const p = portfolio({
      transactions: [
        txn({ kind: 'SELL', realized_pnl: 50 }),
        txn({ kind: 'SELL', realized_pnl: 30 }),
        txn({ kind: 'SELL', realized_pnl: 10 }),
        txn({ kind: 'SELL', realized_pnl: -20 }),
      ],
    });
    const d = metric(rateActivity(p, { now: NOW }), 'decisions');
    expect(d.band).not.toBe('na');
    expect(d.detail).toContain('3/4');
  });
});

describe('rateActivity — cash use', () => {
  it('rates deployment when a ledger exists', () => {
    const p = portfolio({
      cash_balance: 2_000,
      positions: [pos({ ticker: 'AAPL', qty: 80, buy_price: 100, buy_date: '2026-05-01' })], // 8,000
      transactions: [txn({ kind: 'BUY', ticker: 'AAPL', qty: 80, cash_after: 2_000 })],
    });
    const c = metric(rateActivity(p, { now: NOW }), 'cash_use');
    expect(c.band).toBe('strong'); // 80% invested → healthy band
    expect(c.detail).toContain('80% invested');
  });

  it('flags mostly-idle cash', () => {
    const p = portfolio({
      cash_balance: 9_000,
      positions: [pos({ ticker: 'AAPL', qty: 10, buy_price: 100, buy_date: '2026-05-01' })], // 1,000
      transactions: [txn({ kind: 'BUY', ticker: 'AAPL', qty: 10, cash_after: 9_000 })],
    });
    const c = metric(rateActivity(p, { now: NOW }), 'cash_use');
    expect(c.band).toBe('poor'); // 10% deployed (< 0.2 cut) → 28 → poor
    expect(c.tip).toContain('idle');
  });
});

describe('rateActivity — halal mix', () => {
  const p = portfolio({
    positions: [
      pos({ ticker: 'AAPL', qty: 10, buy_price: 100, buy_date: '2026-05-01' }),
      pos({ ticker: 'MSFT', qty: 5, buy_price: 200, buy_date: '2026-05-01' }),
    ],
  });

  it('na when coverage is below half', () => {
    const shariahByTicker: Record<string, ShariahVerdict> = { AAPL: 'pass' }; // 1/2 = 50% — exactly at the cut
    // Only 50% coverage and the cut is "< 0.5", so 50% is rated. Use 0 coverage to force na.
    expect(metric(rateActivity(p, { now: NOW, shariahByTicker: {} }), 'halal_mix').band).toBe('na');
    expect(metric(rateActivity(p, { now: NOW, shariahByTicker }), 'halal_mix').band).not.toBe('na');
  });

  it('all-compliant book scores strong', () => {
    const shariahByTicker: Record<string, ShariahVerdict> = { AAPL: 'pass', MSFT: 'pass' };
    const h = metric(rateActivity(p, { now: NOW, shariahByTicker }), 'halal_mix');
    expect(h.band).toBe('strong');
    expect(h.detail).toContain('2/2');
  });

  it('a concern holding is penalised', () => {
    const shariahByTicker: Record<string, ShariahVerdict> = { AAPL: 'pass', MSFT: 'concern' };
    const h = metric(rateActivity(p, { now: NOW, shariahByTicker }), 'halal_mix');
    expect(h.tip.toLowerCase()).toContain('concern');
    expect(h.score).toBeLessThan(50); // 50% pass − 12 concern penalty
  });

  it('discloses unscreened holdings in the detail (4 held, 2 screened)', () => {
    const p4 = portfolio({
      positions: [
        pos({ ticker: 'AAPL', qty: 10, buy_price: 100, buy_date: '2026-05-01' }),
        pos({ ticker: 'MSFT', qty: 5, buy_price: 200, buy_date: '2026-05-01' }),
        pos({ ticker: 'OPEN1', qty: 1, buy_price: 50, buy_date: '2026-05-01' }),
        pos({ ticker: 'OPEN2', qty: 1, buy_price: 50, buy_date: '2026-05-01' }),
      ],
    });
    // Only the two curated names have verdicts → 2/4 = 50% coverage (rated).
    const shariahByTicker: Record<string, ShariahVerdict> = { AAPL: 'pass', MSFT: 'pass' };
    const h = metric(rateActivity(p4, { now: NOW, shariahByTicker }), 'halal_mix');
    expect(h.band).not.toBe('na');
    expect(h.detail).toContain('2/2 screened pass');
    expect(h.detail).toContain('2 not screened');
    expect(h.tip).toContain('Couldn’t screen 2 of your 4 holdings');
  });
});

describe('rateActivity — overall + determinism', () => {
  it('produces the same rating for the same input', () => {
    const p = portfolio({
      positions: [
        pos({ ticker: 'AAPL', qty: 10, buy_price: 100, buy_date: '2024-01-01' }),
        pos({ ticker: 'MSFT', qty: 5, buy_price: 200, buy_date: '2024-06-01' }),
      ],
      transactions: [txn({ kind: 'BUY', ticker: 'AAPL', qty: 10, reflection_note: 'why' })],
    });
    const a = rateActivity(p, { now: NOW });
    const b = rateActivity(p, { now: NOW });
    expect(a).toEqual(b);
    expect(a.overallScore).toBeGreaterThan(0);
    expect(a.grade).not.toBe('—');
  });
});
