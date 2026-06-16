/**
 * AnnotationSheet
 * Two modes:
 *  - "quick"  : slide-up inline note composer (non-blocking, small footprint)
 *  - "list"   : side drawer of all annotations with swipe-to-resolve/edit/delete
 *
 * Barrel: individual components live under `./annotation/`.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FunnelSimple, Tag as TagIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import {
  getAnnotations,
  getAllTags,
  onAnnotationsChange,
  sortAnnotations,
  type AnnotationSort,
} from '../services/annotationManager';
import { AnnotationRow } from './annotation/AnnotationRow';

export { QuickNoteSheet } from './annotation/QuickNoteSheet';

interface ListProps {
  open: boolean;
  onClose: () => void;
  onJumpToVerse?: (verseKey: string) => void;
}

export function AnnotationListSheet({ open, onClose, onJumpToVerse }: ListProps) {
  const [sort, setSort] = useState<AnnotationSort>('recent');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => onAnnotationsChange(() => setVersion((v) => v + 1)), []);

  const allTags = getAllTags();
  const list = sortAnnotations(getAnnotations(), sort)
    .filter((a) => (showResolved ? true : a.status === 'open'))
    .filter((a) => (tagFilter ? a.tags.includes(tagFilter) : true));
  void version;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-[#0A0E16] border-l border-[#F5E8C7]/10 overflow-y-auto"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="sticky top-0 bg-[#0A0E16] border-b border-[#F5E8C7]/10 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F5E8C7]">Annotations</h2>
              <button onClick={onClose} className="p-1 rounded hover:bg-[#F5E8C7]/[0.08] text-[#C9C0A8]">
                <X size={18} />
              </button>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 space-y-2 border-b border-[#F5E8C7]/10">
              <div className="flex items-center gap-1.5">
                <FunnelSimple size={14} className="text-[#8A8270]" />
                {(['recent', 'page', 'surah'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={cn(
                      'px-2 py-0.5 text-[11px] rounded-full capitalize',
                      sort === s ? 'bg-[#D4A853]/20 text-[#D4A853]' : 'text-[#8A8270] hover:text-[#F5E8C7]',
                    )}
                  >
                    {s === 'recent' ? 'Recent' : `By ${s}`}
                  </button>
                ))}
                <div className="ml-auto">
                  <button
                    onClick={() => setShowResolved((v) => !v)}
                    className={cn(
                      'px-2 py-0.5 text-[11px] rounded-full',
                      showResolved ? 'bg-[#F5E8C7]/[0.08] text-[#C9C0A8]' : 'text-[#8A8270] hover:text-[#C9C0A8]',
                    )}
                  >
                    {showResolved ? 'Hide resolved' : 'Show resolved'}
                  </button>
                </div>
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <TagIcon size={12} className="text-[#8A8270]" />
                  <button
                    onClick={() => setTagFilter(null)}
                    className={cn(
                      'px-2 py-0.5 text-[10px] rounded-full',
                      tagFilter === null ? 'bg-[#F5E8C7]/[0.08] text-[#F5E8C7]' : 'text-[#8A8270]',
                    )}
                  >
                    all
                  </button>
                  {allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTagFilter(tagFilter === t ? null : t)}
                      className={cn(
                        'px-2 py-0.5 text-[10px] rounded-full',
                        tagFilter === t ? 'bg-[#D4A853]/20 text-[#D4A853]' : 'text-[#8A8270] hover:text-[#F5E8C7]',
                      )}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List */}
            <div className="p-3 space-y-2">
              {list.length === 0 ? (
                <p className="text-center text-[#8A8270] text-xs py-10">No annotations yet.</p>
              ) : (
                list.map((a) => (
                  <AnnotationRow key={a.id} ann={a} onJumpToVerse={onJumpToVerse} />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
