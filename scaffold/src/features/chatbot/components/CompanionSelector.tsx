/**
 * CompanionSelector
 * Modal bottom sheet for choosing companion personas
 * Mirrors Flutter's companion_selector.dart with 4 sections
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Lock } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { COMPANION_SECTIONS, getCompanionById } from '../types/chatbot.types';
import type { Companion } from '../types/chatbot.types';
import { useKycStore } from '@/features/kyc/stores/kyc.store';
import { DeepKycModal } from '@/features/kyc/components/DeepKycModal';

interface CompanionSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CompanionSelector({ open, onClose, selectedId, onSelect }: CompanionSelectorProps) {
  const kycTier = useKycStore((s) => s.kycTier);
  const [showKycModal, setShowKycModal] = useState(false);

  const SAHABIYAT_IDS = new Set(['khadijah', 'aisha', 'fatimah']);

  const handleSelect = (id: string) => {
    // Sahabiyat are coming soon
    if (SAHABIYAT_IDS.has(id)) return;
    // Non-Raya companions require Tier 2
    if (id !== 'raya' && kycTier < 2) {
      setShowKycModal(true);
      return;
    }
    onSelect(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden',
              'bg-[#06080D]/95 backdrop-blur-xl',
              'rounded-t-3xl border-t border-[#D4A853]/25 shadow-[0_-30px_80px_rgba(0,0,0,0.6)]'
            )}
          >
            {/* Handle bar */}
            <div className="sticky top-0 z-10 bg-[#06080D]/80 backdrop-blur-md pb-3 pt-3">
              <div className="w-10 h-1 mx-auto rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] mb-4" />
              <div className="max-w-2xl mx-auto w-full px-5 flex items-center justify-between">
                <h2 className="font-display text-[24px] font-medium text-[#F5E8C7]">
                  Choose Companion
                </h2>
                <button
                  onClick={onClose}
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center border border-[#F5E8C7]/10 bg-[#F5E8C7]/[0.02] text-[#8A8270] hover:text-[#F5E8C7] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto max-h-[calc(85vh-80px)] max-w-2xl mx-auto w-full px-5 pb-8 space-y-6">
              {COMPANION_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] font-semibold text-[#4A4639] uppercase tracking-[2px] mb-2.5">
                    {section.title}
                  </h3>
                  <div className="space-y-2.5">
                    {section.companions.map((cid) => {
                      const c = getCompanionById(cid);
                      const isComingSoon = SAHABIYAT_IDS.has(cid);
                      const isLocked = isComingSoon || (cid !== 'raya' && kycTier < 2);
                      return (
                        <CompanionCard
                          key={c.id}
                          companion={c}
                          isSelected={c.id === selectedId}
                          isLocked={isLocked}
                          isComingSoon={isComingSoon}
                          onSelect={() => handleSelect(c.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* KYC Modal for locked companions */}
          <DeepKycModal
            open={showKycModal}
            onClose={() => setShowKycModal(false)}
            featureName="Companion Access"
          />
        </>
      )}
    </AnimatePresence>
  );
}

function CompanionCard({
  companion,
  isSelected,
  isLocked = false,
  isComingSoon = false,
  onSelect,
}: {
  companion: Companion;
  isSelected: boolean;
  isLocked?: boolean;
  isComingSoon?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-start gap-3.5 p-3.5 rounded-2xl transition-all text-left border backdrop-blur-md',
        isSelected
          ? 'bg-[#D4A853]/[0.12] border-[#D4A853]/40'
          : 'bg-[#0D1016]/70 border-[#F5E8C7]/10 hover:border-[#D4A853]/30 hover:bg-[#0D1016]/90',
        isLocked && 'opacity-60'
      )}
    >
      {/* Icon tile */}
      <div
        className={cn(
          'shrink-0 w-[46px] h-[46px] rounded-[13px] flex items-center justify-center text-xl relative',
          isSelected ? 'bg-[#D4A853]/20' : 'bg-[#D4A853]/[0.08]'
        )}
        style={{ boxShadow: 'inset 0 0 0 1px rgba(245,232,199,0.05)' }}
      >
        {companion.icon}
        {isLocked && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0A0E16] rounded-full flex items-center justify-center border border-[#D4A853]/30">
            <Lock size={9} className="text-[#D4A853]" weight="bold" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-display text-[18px] font-medium leading-tight', isSelected ? 'text-[#E8C97A]' : 'text-[#F5E8C7]')}>
            {companion.name}
          </span>
          {isSelected && <Check size={15} className="text-[#D4A853]" />}
          {isComingSoon && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide" style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)', color: '#0A0E16' }}>
              Soon
            </span>
          )}
          {isLocked && !isComingSoon && <Lock size={12} className="text-[#D4A853]/60" />}
        </div>
        <p className="text-[12px] text-[#C9C0A8] mt-0.5">{companion.title}</p>
        <p className="text-[11.5px] text-[#8A8270] mt-1 font-light">{companion.description}</p>
        {/* Keyword tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {companion.keywords.slice(0, 4).map((kw) => (
            <span
              key={kw}
              className="px-2 py-0.5 rounded-full text-[10px] bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 text-[#8A8270]"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
