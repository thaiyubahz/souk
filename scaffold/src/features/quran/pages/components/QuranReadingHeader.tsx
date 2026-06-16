/**
 * Sticky header for QuranReadingPage — back button, title + streak, action buttons,
 * surah selector + mode switcher + presets row. Verbatim — no behavior changes.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, CaretLeft, Fire, GearSix, MagnifyingGlass, NotePencil,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Surah, ReadingMode } from '../../types/quran.types';
import { READING_PRESETS } from '../../types/quran.types';

interface Props {
  selectedSurah: Surah | null;
  surahs: Surah[];
  streakCount: number;
  lastBookmarkKey: string | null;
  mode: ReadingMode;
  lines: { verseKey: string }[];
  onLoadSurah: (surah: Surah) => void;
  onSetMode: (m: ReadingMode) => void;
  onApplyPreset: (p: typeof READING_PRESETS[number]) => void;
  onSetFocusIndex: (n: number) => void;
  onToggleSettings: () => void;
  onOpenAnnotations: () => void;
}

export function QuranReadingHeader({
  selectedSurah, surahs, streakCount, lastBookmarkKey, mode, lines,
  onLoadSurah, onSetMode, onApplyPreset, onSetFocusIndex, onToggleSettings, onOpenAnnotations,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 bg-[#0A0E16]/95 backdrop-blur-sm border-b border-[#D4A853]/15 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-[#F5E8C7]/[0.08]">
            <CaretLeft size={20} className="text-[#D4A853]" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#F5E8C7] flex items-center gap-2">
              <BookOpen size={20} className="text-[#D4A853]" />
              Quran Reader
            </h1>
            {streakCount > 0 && (
              <p className="text-[11px] text-[#D4A853]/70 flex items-center gap-1">
                <Fire size={12} /> {streakCount} day streak
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastBookmarkKey && (
            <button
              onClick={() => {
                const idx = lines.findIndex((l) => l.verseKey === lastBookmarkKey);
                if (idx >= 0) {
                  onSetFocusIndex(idx);
                  document.getElementById(`verse-${lastBookmarkKey}`)?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-[11px] text-[#D4A853] bg-[#D4A853]/10 px-2 py-1 rounded-lg"
            >
              Resume
            </button>
          )}
          <button
            onClick={() => navigate('/quran/search')}
            className="p-1.5 rounded-lg hover:bg-[#F5E8C7]/[0.08]"
            title="Search concepts"
          >
            <MagnifyingGlass size={19} className="text-[#D4A853]" />
          </button>
          <button
            onClick={onOpenAnnotations}
            className="p-1.5 rounded-lg hover:bg-[#F5E8C7]/[0.08]"
            title="Annotations"
          >
            <NotePencil size={19} className="text-[#D4A853]" />
          </button>
          <button onClick={onToggleSettings} className="p-1.5 rounded-lg hover:bg-[#F5E8C7]/[0.08]">
            <GearSix size={20} className="text-[#C9C0A8]" />
          </button>
        </div>
      </div>

      {/* Surah selector */}
      <div className="flex gap-2">
        <select
          value={selectedSurah?.id ?? 1}
          onChange={(e) => {
            const s = surahs.find((x) => x.id === parseInt(e.target.value));
            if (s) onLoadSurah(s);
          }}
          className="flex-1 min-w-0 bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 rounded-lg px-3 py-1.5 text-[#F5E8C7] text-sm"
        >
          {surahs.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#0A0E16] text-[#F5E8C7]">
              {s.id}. {s.nameSimple} ({s.nameArabic})
            </option>
          ))}
        </select>

        {/* Animated mode switcher — active pill morphs across with layoutId */}
        <div className="flex shrink-0 relative bg-[#F5E8C7]/[0.04] rounded-lg border border-[#F5E8C7]/10 p-0.5">
          {(['focus', 'ayah', 'page'] as ReadingMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onSetMode(m)}
              className={cn(
                'relative px-3 py-1 text-xs capitalize z-10 transition-colors',
                mode === m ? 'text-[#0A0E16] font-semibold' : 'text-[#8A8270] hover:text-[#8A8270]',
              )}
            >
              {mode === m && (
                <motion.span
                  layoutId="reading-mode-pill"
                  className="absolute inset-0 rounded-md"
                  style={{ background: 'linear-gradient(135deg, #E8C97A, #D4A853)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Presets row */}
      <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
        {READING_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onApplyPreset(p)}
            className="px-2 py-0.5 text-[10px] bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 rounded-full text-[#8A8270] hover:text-[#F5E8C7] whitespace-nowrap"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
