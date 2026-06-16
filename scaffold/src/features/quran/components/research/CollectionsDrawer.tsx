/**
 * CollectionsDrawer — slide-in panel listing the user's research collections
 * and the items saved to each. Local-only (localStorage) — same persistence
 * pattern as the existing annotation/highlight managers.
 */

import { useEffect, useState } from 'react';
import type { ResearchCollection } from '../../types/quran.types';
import {
  createCollection,
  deleteCollection,
  listCollections,
  onCollectionsChange,
  removeItemFromCollection,
} from '../../services/researchCollectionsService';
import { SourceCitationChip } from '../governance/SourceCitationChip';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CollectionsDrawer({ open, onClose }: Props) {
  const [collections, setCollections] = useState<ResearchCollection[]>(() => listCollections());
  const [newName, setNewName] = useState('');

  useEffect(() => onCollectionsChange(() => setCollections(listCollections())), []);

  if (!open) return null;

  return (
    <aside
      role="dialog"
      aria-label="Research collections"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col bg-white dark:bg-[#06080D] border-l border-[#15171E] dark:border-[#0D1016] shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-[#15171E] dark:border-[#0D1016] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#8A8270] dark:text-[#F5E8C7]">Saved collections</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close collections"
          className="rounded-md px-2 py-1 text-[#8A8270] hover:bg-[#0D1016]/75 dark:hover:bg-[#0D1016]/75"
        >
          ✕
        </button>
      </header>

      <div className="border-b border-[#15171E] dark:border-[#0D1016] p-3 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection name"
          className="flex-1 rounded-md border border-[#15171E] dark:border-[#11141C] bg-white dark:bg-[#0A0E16] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primaryTeal/30"
        />
        <button
          type="button"
          onClick={() => {
            const t = newName.trim();
            if (!t) return;
            createCollection(t);
            setNewName('');
          }}
          className="rounded-md bg-primaryTeal px-3 py-1.5 text-sm font-medium text-[#F5E8C7] disabled:opacity-50"
          disabled={!newName.trim()}
        >
          Create
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {collections.length === 0 && (
          <p className="text-sm text-[#8A8270] dark:text-[#8A8270]">
            No collections yet. Create one to start saving research findings.
          </p>
        )}

        {collections.map((col) => (
          <section
            key={col.id}
            className="rounded-md border border-[#15171E] dark:border-[#11141C] bg-[#F5E8C7]/[0.04]0 dark:bg-[#0A0E16]/30 p-3 space-y-2"
          >
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#8A8270] dark:text-[#F5E8C7]">
                {col.name}{' '}
                <span className="text-xs text-[#8A8270]">({col.items.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => deleteCollection(col.id)}
                className="text-xs text-[#8A8270] hover:text-red-500"
              >
                Delete
              </button>
            </header>

            {col.items.length === 0 && (
              <p className="text-xs text-[#8A8270] dark:text-[#8A8270]">No saved items.</p>
            )}

            <ul className="space-y-2">
              {col.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded border border-[#15171E] dark:border-[#11141C] p-2 text-xs space-y-1"
                >
                  <p className="text-[#8A8270] dark:text-[#C9C0A8] line-clamp-3">
                    {item.result.excerpt}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <SourceCitationChip citation={item.result.citation} />
                    <button
                      type="button"
                      onClick={() => removeItemFromCollection(col.id, item.id)}
                      className="text-[#8A8270] hover:text-red-500"
                      aria-label="Remove from collection"
                    >
                      remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
