/**
 * RayaResponseCard — empty/loading/error/result panel for CircleRayaSheet.
 */

import { FloppyDisk, Spinner } from '@phosphor-icons/react';

type Tone = 'summary' | 'prompt' | 'plan' | 'free';

interface Props {
  streaming: boolean;
  response: string;
  error: string | null;
  lastTone: Tone | null;
  saved: boolean;
  onSave: () => void;
}

export function RayaResponseCard({ streaming, response, error, lastTone, saved, onSave }: Props) {
  if (!response && !streaming && !error) {
    return (
      <div className="text-center py-8 text-[#8A8270] text-sm">
        Tap a quick action above, or ask Raya anything about this circle.
      </div>
    );
  }

  return (
    <>
      {streaming && !response && (
        <div className="flex items-center gap-2 py-6 text-[#C9C0A8] text-sm justify-center">
          <Spinner size={14} className="animate-spin" /> Raya is thinking…
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-rose-200 text-xs">{error}</div>
      )}
      {response && (
        <div className="rounded-xl bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 p-4">
          <p className="text-[13px] text-[#F5E8C7] whitespace-pre-wrap leading-relaxed">{response}</p>
          {streaming && <Spinner size={12} className="animate-spin mt-2 text-[#8A8270]" />}
          {!streaming && lastTone === 'free' && (
            <button
              onClick={onSave}
              disabled={saved}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A853]/15 border border-[#D4A853]/30 text-[#D4A853] text-xs font-semibold disabled:opacity-50"
            >
              <FloppyDisk size={12} weight="fill" /> {saved ? 'Saved as note ✓' : 'Save as note'}
            </button>
          )}
          {!streaming && lastTone && lastTone !== 'free' && saved && (
            <p className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1">
              <FloppyDisk size={11} weight="fill" /> Saved automatically to circle notes.
            </p>
          )}
        </div>
      )}
    </>
  );
}
