/**
 * SurahSummaryPanel
 *
 * Surah-level theme, key topics, revelation context, and source attribution.
 * Sits above the verse list on QuranReadingPage. Collapsible so it doesn't
 * dominate the reading flow on return visits.
 *
 * The `source_tier` field on the payload drives the framing:
 *   - "curated"  — high-confidence presentation, scholar attribution chips.
 *   - "rag"      — qualified presentation; the user sees this came from the
 *                  indexed tafsir/book chunks, not a hand-vetted summary.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SurahSummary } from '../types/quran.types';
import { fetchSurahSummary } from '../services/surahSummaryService';
import { SourceCitationChip } from './governance/SourceCitationChip';

interface Props {
  surahId: number;
  /** Render collapsed by default. Defaults to true. */
  defaultCollapsed?: boolean;
  className?: string;
}

export function SurahSummaryPanel({ surahId, defaultCollapsed = true, className }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [summary, setSummary] = useState<SurahSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchSurahSummary(surahId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load surah summary.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [surahId]);

  // Reset when surah changes.
  useEffect(() => {
    setSummary(null);
    setError(null);
  }, [surahId]);

  useEffect(() => {
    if (!collapsed && !summary && !loading && !error) {
      void load();
    }
  }, [collapsed, summary, loading, error, load]);

  const ragNotice = summary?.source_tier === 'rag';

  // When the backend is unavailable and we have no cached summary, the
  // panel adds no value. Hide it entirely so the reader looks tidy.
  if (error && !summary) return null;

  return (
    <section
      aria-label="Surah summary"
      className={`rounded-md border border-[#15171E] dark:border-[#11141C] bg-[#F5E8C7]/[0.04]0 dark:bg-[#0A0E16]/30 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-[#8A8270] dark:text-[#C9C0A8] hover:bg-[#0D1016]/60 dark:hover:bg-[#0D1016]/40 rounded-t-md"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-gold">◇</span>
          Surah Summary
          {summary?.revelation_place && (
            <span className="text-xs text-[#8A8270]">· {summary.revelation_place}</span>
          )}
        </span>
        <span aria-hidden="true" className="text-[#8A8270]">{collapsed ? '+' : '−'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {loading && (
            <div className="space-y-2" aria-busy="true">
              <div className="h-3 rounded bg-[#0D1016]/75 backdrop-blur-md dark:bg-[#0D1016]/75 animate-pulse" />
              <div className="h-3 rounded bg-[#0D1016]/75 backdrop-blur-md dark:bg-[#0D1016]/75 animate-pulse w-5/6" />
            </div>
          )}

          {/* Errors are silent — the summary is supplementary, the reader
              works without it. Retry happens implicitly on next surah change. */}

          {!loading && !error && summary && (
            <>
              {ragNotice && (
                <p className="text-xs italic text-[#8A8270] dark:text-[#8A8270]">
                  Drawn from indexed tafsir sources rather than a hand-curated summary.
                </p>
              )}

              {summary.theme && (
                <p className="text-sm font-medium text-[#8A8270] dark:text-[#F5E8C7] leading-relaxed">
                  {summary.theme}
                </p>
              )}

              {summary.key_topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {summary.key_topics.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gold/10 text-gold border border-gold/30"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {summary.context && (
                <p className="text-sm text-[#8A8270] dark:text-[#C9C0A8] leading-relaxed whitespace-pre-wrap">
                  {summary.context}
                </p>
              )}

              {summary.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {summary.sources.map((s, i) => (
                    <SourceCitationChip
                      key={`${s.book}-${i}`}
                      citation={{ kind: 'book', book: s.book, author: s.author }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
