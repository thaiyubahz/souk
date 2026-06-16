/**
 * cosmicUI — shared primitives for the "Raya universe" page redesign.
 * Glassy gold-rule cards, section labels, gold/ghost buttons, pills, stat rows —
 * the building blocks every redesigned feature page composes from.
 */

import type { ReactNode } from 'react';

export function CosmicCard({
  children,
  className = '',
  accent,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  /** Optional left accent rule colour. */
  accent?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={`rounded-[18px] border border-[#F5E8C7]/10 bg-[#0D1016]/70 backdrop-blur-md p-5 sm:p-6 ${
        onClick ? 'cursor-pointer transition-colors hover:border-[#D4A853]/35 hover:bg-[#0D1016]/90' : ''
      } ${className}`}
      style={accent ? { borderLeft: `2px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

export function CosmicKicker({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] tracking-[1.6px] uppercase text-[#D4A853] font-semibold mb-3">{children}</div>
  );
}

export function CosmicSectionTitle({ children, ar }: { children: ReactNode; ar?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 className="font-display text-[24px] font-medium text-[#F5E8C7]">{children}</h2>
      {ar && <span className="font-arabic text-[15px] text-[#8A8270]">{ar}</span>}
    </div>
  );
}

export function GoldButton({
  children,
  onClick,
  className = '',
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 text-[13px] font-medium px-[18px] py-[10px] rounded-[12px] text-[#1a1206] bg-gradient-to-br from-[#E8C97A] to-[#D4A853] hover:brightness-110 transition-all ${
        full ? 'w-full' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className = '',
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 text-[13px] px-[18px] py-[10px] rounded-[12px] border border-[#F5E8C7]/15 text-[#C9C0A8] hover:border-[#D4A853]/40 hover:text-[#F5E8C7] transition-all ${
        full ? 'w-full' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function CosmicPill({
  children,
  tone = 'soft',
}: {
  children: ReactNode;
  tone?: 'soft' | 'ok' | 'warn';
}) {
  const tones = {
    soft: 'text-[#C9C0A8] bg-[#F5E8C7]/[0.04] border-[#F5E8C7]/10',
    ok: 'text-[#5fc99a] bg-[#2A9D6F]/12 border-[#2A9D6F]/30',
    warn: 'text-[#E8C97A] bg-[#D4A853]/12 border-[#D4A853]/30',
  } as const;
  return (
    <span className={`text-[11px] px-[10px] py-[4px] rounded-full border ${tones[tone]}`}>{children}</span>
  );
}

export function StatRow({
  label,
  value,
  warn,
}: {
  label: ReactNode;
  value: ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-[13px] border-b border-[#F5E8C7]/[0.06] last:border-0 text-[13.5px]">
      <span className="text-[#C9C0A8] font-light">{label}</span>
      <span className={warn ? 'text-[#E8C97A]' : 'text-[#F5E8C7]'}>{value}</span>
    </div>
  );
}
