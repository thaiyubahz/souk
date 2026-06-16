/**
 * ResearchResultCard — single result row in the research workspace.
 *
 * Every result carries a citation chip resolved to one of the three bucket
 * kinds (Quran / hadith / book). The "Save to collection" button delegates
 * to the parent so the workspace can route to the user's chosen collection.
 */

import type { ResearchResult } from '../../types/quran.types';
import { SourceCitationChip } from '../governance/SourceCitationChip';

interface Props {
  result: ResearchResult;
  onSave?: (result: ResearchResult) => void;
  /** Optional "Add to study sheet" action — appears next to Save when provided. */
  onAddToSheet?: (result: ResearchResult) => void;
  className?: string;
}

const BUCKET_LABEL: Record<ResearchResult['bucket'], string> = {
  quran: 'Quran',
  hadith: 'Hadith',
  tafsir: 'Tafsir / Books',
};

export function ResearchResultCard({ result, onSave, onAddToSheet, className }: Props) {
  return (
    <article
      className={`rounded-md border border-[#15171E] dark:border-[#11141C] bg-[#F5E8C7]/[0.04]0 dark:bg-[#0A0E16]/30 p-4 space-y-2 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-[#8A8270] dark:text-[#8A8270]">
          {BUCKET_LABEL[result.bucket]}
        </span>
        <div className="flex items-center gap-2">
          {onAddToSheet && (
            <button
              type="button"
              onClick={() => onAddToSheet(result)}
              className="text-xs px-2.5 py-1 rounded border border-[#15171E] dark:border-[#11141C] text-[#8A8270] dark:text-[#C9C0A8] hover:bg-[#0D1016]/75 dark:hover:bg-[#0D1016]/75"
            >
              Add to sheet
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(result)}
              className="text-xs px-2.5 py-1 rounded border border-primaryTeal/30 text-primaryTeal hover:bg-primaryTeal/10"
            >
              Save
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-[#8A8270] dark:text-[#C9C0A8] leading-relaxed whitespace-pre-wrap">
        {result.excerpt}
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        <SourceCitationChip
          citation={result.citation}
          snippet={
            result.citation.kind === 'quran' && result.citation.arabic_text
              ? { arabic: result.citation.arabic_text }
              : undefined
          }
        />
      </div>
    </article>
  );
}
