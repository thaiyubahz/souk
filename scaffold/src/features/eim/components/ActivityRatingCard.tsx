/**
 * "Rate My Activity" — inline results panel for the simulator.
 *
 * The friendly, instant cousin of EIM Mirror: renders the deterministic
 * `rateActivity()` output (overall grade + six light sub-scores) for one
 * sandbox portfolio. Pure presentation — all scoring lives in
 * `engine/activityRating.ts`.
 *
 * Shariah data for the "halal mix" metric is read from the curated-assets
 * list the portfolio page already has cached (one warm query, no per-ticker
 * network fan-out). Holdings outside the curated universe simply count as
 * `unknown`, and the metric degrades to `na` when coverage is too thin.
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { BookOpen, Scales, Sparkle } from '@phosphor-icons/react';

import { eimTrack } from '../analytics';
import {
  rateActivity,
  SHARIAH_BORDERLINE_COMPOSITE,
  SHARIAH_PASS_COMPOSITE,
  type RatedMetric,
  type RatingBand,
  type ShariahVerdict,
} from '../engine/activityRating';
import { computeHoldings } from '../engine/holdings';
import { eimService } from '../services/eim.service';
import type { Asset, Portfolio } from '../types/eim.types';

const BAND_COLOR: Record<RatingBand, string> = {
  poor: '#EF5350',
  fair: '#E8C97A',
  good: '#7BB39A',
  strong: '#2A9D6F',
  na: '#5C5749',
};

const BAND_LABEL: Record<RatingBand, string> = {
  poor: 'Work on this',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
  na: 'Not yet rated',
};

const SECTION_TITLE = {
  activity: 'How you trade',
  holdings: 'What you hold',
} as const;

/** Curated `TripleShariah.composite` → simple verdict bands (mirrors the
 *  thresholds the engine documents). */
function verdictFromComposite(composite: number): ShariahVerdict {
  if (composite >= SHARIAH_PASS_COMPOSITE) return 'pass';
  if (composite >= SHARIAH_BORDERLINE_COMPOSITE) return 'borderline';
  return 'concern';
}

export function ActivityRatingCard({
  portfolio,
  curatedAssets,
  now,
}: {
  portfolio: Portfolio;
  curatedAssets: Asset[] | undefined;
  /** "Now" reference for time-based metrics (e.g. patience). In a finished
   *  Time Machine sim this is the session's `current_sim_date`, so hold
   *  durations are measured in sim-time, not against the real-world clock.
   *  Defaults to the real current time. */
  now?: Date;
}) {
  const navigate = useNavigate();

  // Every distinct held ticker — we want to screen ALL of them for the halal
  // mix, not just the ones in the curated starter list.
  const heldTickers = useMemo(
    () => computeHoldings(portfolio).map((h) => h.ticker),
    [portfolio],
  );

  // Fetch each holding's live Shariah snapshot. Shares the react-query cache
  // (['eim','snapshot',ticker]) with the portfolio page, so these are usually
  // warm. The snapshot's triple-standard composite covers the open universe,
  // where the curated list can't.
  const snapshotQueries = useQueries({
    queries: heldTickers.map((ticker) => ({
      queryKey: ['eim', 'snapshot', ticker],
      queryFn: () => eimService.getStockSnapshot(ticker),
      staleTime: 5 * 60_000,
    })),
  });

  // Stable signature of resolved composites so the memo below only recomputes
  // when a verdict actually changes (snapshotQueries is a fresh array/render).
  const snapshotSig = heldTickers
    .map((t, i) => `${t}:${snapshotQueries[i]?.data?.shariah?.composite ?? '?'}`)
    .join('|');

  // Build the per-ticker Shariah verdict map: curated list first (instant
  // fallback), then snapshot composites override as they resolve. Tickers
  // still without data are left out → the engine treats them as `unknown`.
  const shariahByTicker = useMemo(() => {
    const map: Record<string, ShariahVerdict> = {};
    for (const a of curatedAssets ?? []) {
      const composite = a.triple_shariah?.composite;
      if (typeof composite === 'number') {
        map[a.ticker] = verdictFromComposite(composite);
      }
    }
    for (const part of snapshotSig.split('|')) {
      if (!part) continue;
      const idx = part.lastIndexOf(':');
      const ticker = part.slice(0, idx);
      const raw = part.slice(idx + 1);
      if (raw !== '?') map[ticker] = verdictFromComposite(Number(raw));
    }
    return map;
  }, [curatedAssets, snapshotSig]);

  const rating = useMemo(
    () => rateActivity(portfolio, { shariahByTicker, now }),
    [portfolio, shariahByTicker, now],
  );

  // Fire the analytics event once per mount (the card mounts when the user
  // taps "Rate my activity").
  useEffect(() => {
    eimTrack('eim_activity_rated');
  }, []);

  const activity = rating.metrics.filter((m) => m.section === 'activity');
  const holdings = rating.metrics.filter((m) => m.section === 'holdings');

  if (!rating.hasEnoughData) {
    return (
      <div className="rounded-2xl border border-[rgba(212,168,83,0.25)] bg-[rgba(212,168,83,0.04)] p-5 text-center">
        <Scales size={26} weight="duotone" className="text-[#D4A853] mx-auto" />
        <div className="text-[14px] font-bold text-[#F5E8C7] mt-2.5">
          Not enough to rate yet
        </div>
        <p className="text-[12px] text-[#7A7363] leading-relaxed mt-1.5">
          {rating.headline}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(212,168,83,0.25)] bg-[#0D1016]/75 backdrop-blur-md overflow-hidden">
      {/* Hero — grade + archetype + headline */}
      <div className="p-5 bg-gradient-to-br from-[rgba(212,168,83,0.10)] to-[rgba(42,157,111,0.06)]">
        <div className="flex items-center gap-4">
          <GradeBadge grade={rating.grade} score={rating.overallScore} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[#D4A853] font-semibold flex items-center gap-1.5">
              <Sparkle size={11} weight="fill" /> Rate my activity
            </div>
            <div className="text-[17px] font-bold text-[#F5E8C7] leading-tight mt-0.5">
              {rating.archetype}
            </div>
            <p className="text-[11.5px] text-[#9A927E] leading-relaxed mt-1">
              {rating.headline}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        <MetricSection
          title={SECTION_TITLE.activity}
          metrics={activity}
          onLesson={(id) => navigate(`/eim/lesson/${id}`)}
        />
        <MetricSection
          title={SECTION_TITLE.holdings}
          metrics={holdings}
          onLesson={(id) => navigate(`/eim/lesson/${id}`)}
        />

        <p className="text-[10.5px] text-[#5C5749] leading-relaxed text-center pt-1">
          A simple, instant read of your sandbox — not financial advice. For a
          deep behavioural audit of your real trades, see EIM Mirror.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const color =
    score >= 80
      ? '#2A9D6F'
      : score >= 66
        ? '#7BB39A'
        : score >= 50
          ? '#E8C97A'
          : '#EF5350';
  return (
    <div
      className="w-16 h-16 shrink-0 rounded-2xl flex flex-col items-center justify-center border"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}14` }}
    >
      <span className="text-[24px] font-black leading-none" style={{ color }}>
        {grade}
      </span>
      <span className="text-[9px] text-[#7A7363] mt-0.5">{score}/100</span>
    </div>
  );
}

function MetricSection({
  title,
  metrics,
  onLesson,
}: {
  title: string;
  metrics: RatedMetric[];
  onLesson: (lessonId: string) => void;
}) {
  if (metrics.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#5C5749] font-semibold mb-2.5">
        {title}
      </div>
      <div className="space-y-3">
        {metrics.map((m) => (
          <MetricRow key={m.id} metric={m} onLesson={onLesson} />
        ))}
      </div>
    </div>
  );
}

function MetricRow({
  metric,
  onLesson,
}: {
  metric: RatedMetric;
  onLesson: (lessonId: string) => void;
}) {
  const color = BAND_COLOR[metric.band];
  const isNa = metric.band === 'na';
  return (
    <div className="rounded-xl border border-[rgba(212,168,83,0.10)] bg-[#0C0F15]/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-semibold text-[#F5E8C7]">{metric.label}</span>
          {metric.concept && (
            <span className="text-[9.5px] uppercase tracking-wider text-[#D4A853] bg-[rgba(212,168,83,0.10)] px-1.5 py-0.5 rounded">
              {metric.concept}
              {metric.conceptAr ? ` · ${metric.conceptAr}` : ''}
            </span>
          )}
        </div>
        <span
          className="text-[9.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          {BAND_LABEL[metric.band]}
        </span>
      </div>

      <PipBar pips={metric.pips} color={color} dim={isNa} />

      <p className="text-[11px] text-[#9A927E] mt-1.5">{metric.detail}</p>
      <p className="text-[11.5px] text-[#C9BfA6] leading-relaxed mt-1">{metric.tip}</p>

      {metric.lessonId && (
        <button
          onClick={() => onLesson(metric.lessonId!)}
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#D4A853] hover:text-[#E8C97A] transition-colors"
        >
          <BookOpen size={12} weight="bold" />
          Tap to learn
        </button>
      )}
    </div>
  );
}

function PipBar({ pips, color, dim }: { pips: number; color: string; dim: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mt-2" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{
            backgroundColor: !dim && i < pips ? color : 'rgba(212,168,83,0.12)',
          }}
        />
      ))}
    </div>
  );
}
