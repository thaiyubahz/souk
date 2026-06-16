/**
 * Single sidebar nav item — "Raya's Universe" rail style: a colored icon tile,
 * serif name with optional Arabic, a one-line description, gold active state,
 * and SOON / premium badges.
 */

import { House, Lock, CaretRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { GATED_SIDEBAR_IDS } from '@/features/kyc/types/kyc.types';
import type { NavItemConfig } from '../../types/navigation.types';
import { ICON_MAP, ICON_COLOR_MAP } from './_constants';

interface SidebarItemProps {
  item: NavItemConfig;
  isActive: boolean;
  kycTier: number;
  unreadCount: number;
  onNav: (item: NavItemConfig) => void;
  /** When the parent sidebar is in persistent (lg+ collapsed-rail) mode,
   *  text hides unless the rail is hovered. */
  persistent?: boolean;
}

export function SidebarItem({
  item, isActive: active, kycTier, unreadCount, onNav, persistent = false,
}: SidebarItemProps) {
  const Icon = ICON_MAP[item.icon] ?? House;
  const isNotification = item.id === 'notifications';
  const accent = ICON_COLOR_MAP[item.id] || '#D4A853';
  const isGated = kycTier < 2 && GATED_SIDEBAR_IDS.has(item.id);
  const isSoon = item.badge === 'SOON';

  const tourId =
    item.id === 'zakat' ? 'sidebar-zakat'
    : item.id === 'screener' ? 'sidebar-screener'
    : item.id === 'quran' ? 'sidebar-quran'
    : item.id === 'wallet' ? 'sidebar-wallet'
    : undefined;

  return (
    <button
      data-tour={tourId}
      onClick={() => onNav(item)}
      title={isGated ? `${item.label} (locked)` : item.label}
      className={cn(
        'group/item w-full text-left flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-200',
        active
          ? 'bg-[#0D1016]/75 backdrop-blur-md border-[#D4A853]/30'
          : 'border-transparent hover:bg-[#0D1016]/75 hover:border-[#F5E8C7]/10',
        isGated && 'opacity-60'
      )}
    >
      {/* Colored icon tile */}
      <span
        className="relative w-[44px] h-[44px] rounded-[13px] flex items-center justify-center shrink-0"
        style={{ background: `${accent}1f`, color: accent, boxShadow: 'inset 0 0 0 1px rgba(245,232,199,0.05)' }}
      >
        <Icon size={20} weight={active ? 'duotone' : 'regular'} />
        {isGated && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#0A0E16] rounded-full flex items-center justify-center border border-[#D4A853]/30">
            <Lock size={8} className="text-[#D4A853]" weight="bold" />
          </span>
        )}
        {isNotification && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 bg-red-500 rounded-full text-[8px] text-[#F5E8C7] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </span>

      {/* Name + description */}
      <span className={cn(
        'flex-1 min-w-0',
        persistent && 'lg:hidden lg:group-hover/sidebar:block'
      )}>
        <span className="font-display text-[18px] font-medium text-[#F5E8C7] flex items-baseline gap-2 leading-tight">
          <span className="truncate">{item.label}</span>
          {item.ar && (
            <span className="font-arabic text-[12px] shrink-0" style={{ color: accent }}>{item.ar}</span>
          )}
          {item.badge && item.badge !== 'SOON' && !isGated && (
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)', color: '#0A0E16' }}
            >
              {item.badge}
            </span>
          )}
        </span>
        {item.description && (
          <span className="block text-[11.5px] text-[#8A8270] font-light mt-0.5 truncate">{item.description}</span>
        )}
      </span>

      {/* Right: SOON tag or active/hover caret */}
      {isSoon ? (
        <span className={cn(
          'text-[9px] tracking-[1px] uppercase text-[#4A4639] border border-[#F5E8C7]/10 px-2 py-[3px] rounded-full shrink-0',
          persistent && 'lg:hidden lg:group-hover/sidebar:inline-block'
        )}>
          Soon
        </span>
      ) : (
        <CaretRight
          size={15}
          className={cn(
            'shrink-0 text-[#4A4639] transition-transform group-hover/item:translate-x-[2px]',
            persistent && 'lg:hidden lg:group-hover/sidebar:block'
          )}
          style={{ color: active ? accent : undefined }}
        />
      )}
    </button>
  );
}
