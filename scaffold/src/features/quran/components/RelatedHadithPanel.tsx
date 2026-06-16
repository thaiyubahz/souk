/**
 * RelatedHadithPanel
 *
 * Renders verified hadith linked to a Quran ayah. Wired into FocusView /
 * AyahView in the reading page. Collapsible by default so it doesn't crowd
 * the verse — users opt in.
 *
 * Governance: every item shows a SourceCitationChip with the verified
 * collection name, hadith number, and grade (e.g. "Sahih al-Bukhari #6035 ·
 * Sahih"). The fetch is read-only and the data comes from the
 * citation-enforced backend pipeline, so no AiDisclaimerBanner is needed on
 * this panel specifically (the chips are the audit trail).
 */

import { useCallback, useEffect, useState } from 'react';
import type { RelatedHadith } from '../types/quran.types';
import { fetchRelatedHadith, clearRelatedHadithCache } from '../services/relatedHadithService';
import { SourceCitationChip } from './governance/SourceCitationChip';

interface Props {
  verseKey: string;
  /** Render collapsed by default. Defaults to true. */
  defaultCollapsed?: boolean;
  className?: string;
}

export function RelatedHadithPanel({ verseKey, defaultCollapsed = true, className }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RelatedHadith[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRelatedHadith(verseKey, 5);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load related hadith.');
      setItems(null);
    } finally {
      setLoading(false);
    }
  }, [verseKey]);

  // Lazy-load: only fetch when the panel is expanded for the first time.
  useEffect(() => {
    if (!collapsed && items === null && !loading && !error) {
      void load();
    }
  }, [collapsed, items, loading, error, load]);

  const onRetry = useCallback(() => {
    clearRelatedHadithCache();
    void load();
  }, [load]);

  return (
    <section
      aria-label={`Related hadith for verse ${verseKey}`}
      className={`rounded-md border border-[#15171E] dark:border-[#11141C] bg-[#F5E8C7]/[0.04]0 dark:bg-[#0A0E16]/30 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-[#8A8270] dark:text-[#C9C0A8] hover:bg-[#0D1016]/60 dark:hover:bg-[#0D1016]/40 rounded-t-md"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-primaryTeal">◈</span>
          Related Hadith
          {items && items.length > 0 && (
            <span className="text-xs text-[#8A8270]">({items.length})</span>
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
              <div className="h-3 rounded bg-[#0D1016]/75 backdrop-blur-md dark:bg-[#0D1016]/75 animate-pulse w-4/6" />
            </div>
          )}

          {!loading && error && (
            <div className="text-sm text-[#8A8270] dark:text-[#C9C0A8]">
              <p className="mb-2">Could not load hadith for this ayah.</p>
              <button
                type="button"
                onClick={onRetry}
                className="text-xs px-3 py-1 rounded border border-primaryTeal/30 text-primaryTeal hover:bg-primaryTeal/10"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && items && items.length === 0 && (
            <p className="text-sm text-[#8A8270] dark:text-[#8A8270]">
              No verified hadith linked to this ayah yet.
            </p>
          )}

          {!loading && !error && items && items.length > 0 && (
            <ul className="space-y-4">
              {items.map((h) => (
                <li
                  key={`${h.collection_slug}:${h.number}`}
                  className="border-l-2 border-primaryTeal/30 pl-3"
                >
                  {h.arabic && (
                    <p className="font-arabic text-base leading-relaxed text-right text-[#8A8270] dark:text-[#F5E8C7] mb-1.5">
                      {h.arabic}
                    </p>
                  )}
                  {h.english && (
                    <p className="text-sm italic text-[#8A8270] dark:text-[#C9C0A8] mb-1.5 leading-relaxed">
                      “{h.english}”
                    </p>
                  )}
                  {h.narrator && (
                    <p className="text-xs text-[#8A8270] dark:text-[#8A8270] mb-1.5">
                      Narrated by {h.narrator}
                    </p>
                  )}
                  <SourceCitationChip
                    citation={{
                      kind: 'hadith',
                      collection: h.collection,
                      number: h.number,
                      narrator: h.narrator,
                      grade: h.grade,
                    }}
                    snippet={{ arabic: h.arabic, english: h.english }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
