/**
 * StudySheetComposer
 *
 * Guided thematic research wizard (PDF Section 11 item 3). Lets a learner
 * compose a single "study sheet" from selected research results across the
 * three buckets, add a title + personal reflection, then export as Markdown
 * or JSON. Pure client-side — no PII leaves the device unless the learner
 * shares the file.
 */

import { useState } from 'react';
import type { ResearchResult } from '../../types/quran.types';
import { SourceCitationChip } from '../governance/SourceCitationChip';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Topic / query that produced these results. Pre-fills the sheet title. */
  topic: string;
  /** User-selected research results to include in the sheet. */
  selected: ResearchResult[];
  onRemove: (idx: number) => void;
}

function citationLabel(r: ResearchResult): string {
  const c = r.citation;
  if (c.kind === 'quran') return `Quran ${c.verse_key}${c.surah_name ? ` · ${c.surah_name}` : ''}`;
  if (c.kind === 'hadith') return `${c.collection} #${c.number}${c.grade ? ` · ${c.grade}` : ''}`;
  return c.author ? `${c.book} · ${c.author}` : c.book;
}

function toMarkdown(title: string, topic: string, reflection: string, results: ResearchResult[]): string {
  const lines = [`# ${title || `Study sheet — ${topic}`}`, ''];
  lines.push(`Topic: **${topic}**`, '', `Generated: ${new Date().toISOString()}`, '');
  if (reflection) lines.push('## Reflection', '', reflection, '');
  const groups: Record<string, ResearchResult[]> = { quran: [], hadith: [], tafsir: [] };
  for (const r of results) groups[r.bucket].push(r);
  for (const [bucket, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    lines.push(`## ${bucket === 'tafsir' ? 'Tafsir & Books' : bucket[0].toUpperCase() + bucket.slice(1)}`, '');
    for (const r of items) {
      lines.push(`- _${citationLabel(r)}_`);
      const snippet = r.excerpt.replace(/\n+/g, ' ').trim();
      lines.push(`  > ${snippet}`);
      lines.push('');
    }
  }
  lines.push(
    '---',
    '',
    '_Citations are pulled from the Rayah Plus Quran indexed sources. Confirm sensitive matters with a qualified scholar._',
  );
  return lines.join('\n');
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 250);
}

export function StudySheetComposer({ open, onClose, topic, selected, onRemove }: Props) {
  const [title, setTitle] = useState('');
  const [reflection, setReflection] = useState('');

  if (!open) return null;

  const onExportMarkdown = () => {
    const md = toMarkdown(title, topic, reflection, selected);
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = (title || topic).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
    download(`study-sheet-${slug || 'topic'}-${stamp}.md`, md, 'text/markdown');
  };

  const onExportJson = () => {
    const payload = {
      title: title || `Study sheet — ${topic}`,
      topic,
      reflection,
      results: selected,
      generatedAt: new Date().toISOString(),
    };
    const stamp = new Date().toISOString().slice(0, 10);
    download(`study-sheet-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col bg-white dark:bg-[#06080D] border-l border-[#15171E] dark:border-[#0D1016] shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-[#15171E] dark:border-[#0D1016] px-4 py-3">
        <h2 id="sheet-title" className="text-sm font-semibold text-[#8A8270] dark:text-[#F5E8C7]">
          Study sheet
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close composer"
          className="rounded-md px-2 py-1 text-[#8A8270] hover:bg-[#0D1016]/75 dark:hover:bg-[#0D1016]/75"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-sm">
        <label className="block">
          <span className="block text-xs font-medium text-[#8A8270] dark:text-[#C9C0A8] mb-1">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Study sheet — ${topic}`}
            className="w-full rounded border border-[#15171E] dark:border-[#11141C] bg-white dark:bg-[#0A0E16] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primaryTeal/30"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-[#8A8270] dark:text-[#C9C0A8] mb-1">
            Personal reflection
          </span>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            placeholder="What did this study reveal? What action are you taking?"
            className="w-full rounded border border-[#15171E] dark:border-[#11141C] bg-white dark:bg-[#0A0E16] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primaryTeal/30"
          />
        </label>

        <div>
          <p className="text-xs font-medium text-[#8A8270] dark:text-[#C9C0A8] mb-2">
            Selected sources ({selected.length})
          </p>
          {selected.length === 0 ? (
            <p className="text-xs text-[#8A8270]">
              Use the "Add to sheet" action on result cards to start composing.
            </p>
          ) : (
            <ul className="space-y-2">
              {selected.map((r, i) => (
                <li
                  key={`${r.bucket}-${i}-${r.relevance_score}`}
                  className="rounded border border-[#15171E] dark:border-[#11141C] p-2 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <SourceCitationChip citation={r.citation} />
                    <button
                      type="button"
                      onClick={() => onRemove(i)}
                      className="text-[#8A8270] hover:text-rose-500"
                      aria-label="Remove"
                    >
                      remove
                    </button>
                  </div>
                  <p className="text-[#8A8270] dark:text-[#C9C0A8] line-clamp-3">{r.excerpt}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <footer className="border-t border-[#15171E] dark:border-[#0D1016] p-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onExportJson}
          disabled={selected.length === 0}
          className="rounded border border-primaryTeal/30 text-primaryTeal px-3 py-1.5 text-xs disabled:opacity-50"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={onExportMarkdown}
          disabled={selected.length === 0}
          className="rounded bg-primaryTeal px-3 py-1.5 text-xs font-medium text-[#F5E8C7] disabled:opacity-50"
        >
          Export Markdown
        </button>
      </footer>
    </aside>
  );
}
