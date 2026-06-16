/**
 * Compact Icon Sidebar — matches Flutter's AppSidebar exactly
 * 72px width, icon-only with section dividers, teal active state
 * Each icon has a unique color from ICON_COLOR_MAP
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { SignOut, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/core/stores/auth.store';
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { useKycStore } from '@/features/kyc/stores/kyc.store';
import { SIDEBAR_SECTIONS, type NavItemConfig } from '../types/navigation.types';
import { SidebarItem } from './sidebar/SidebarItem';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  /**
   * When true, sidebar is always visible on lg+ as a narrow icon rail that
   * hover-expands to 240px. Parent layout MUST reserve `lg:pl-[72px]` so the
   * content isn't covered. When false (default), sidebar behaves as a drawer
   * on all sizes (only visible when `isOpen`).
   */
  persistent?: boolean;
}

export function Sidebar({ isOpen = false, onClose, persistent = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const kycTier = useKycStore((s) => s.kycTier);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleNav = (item: NavItemConfig) => {
    // Always start a fresh chat when clicking Raya
    if (item.path === '/ai-assistant') {
      navigate(item.path, { state: { newChat: Date.now() } });
    } else {
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <>
      {/* Overlay backdrop — visible only when drawer is open. In persistent mode
          on lg+, the sidebar is always visible so the backdrop has no role. */}
      {isOpen && (
        /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- sidebar backdrop; close button & Escape handle a11y */
        <div
          className={cn(
            'fixed inset-0 z-40 transition-opacity bg-[#04060A]/55 backdrop-blur-[2px]',
            persistent && 'lg:hidden'
          )}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'group/sidebar peer/sidebar fixed top-0 left-0 flex flex-col h-screen bg-gradient-to-b from-[#0A0E16] to-[#06080D] border-r border-[#F5E8C7]/10 backdrop-blur-xl shadow-[30px_0_80px_rgba(0,0,0,0.5)] shrink-0 transition-all duration-300 ease-in-out',
          'z-50',
          // Drawer default: 300px wide, isOpen-controlled translate.
          'w-[300px]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Persistent mode (lg+): narrow icon rail, hover-expands to 240.
          // `lg:z-[60]` keeps the expanded panel above any sticky top nav
          // (e.g. BarkaTopNav) so the page chrome doesn't bleed into it.
          persistent && 'lg:w-[72px] lg:hover:w-[240px] lg:translate-x-0 lg:z-[60]'
        )}
      >
      {/* Universe-style header */}
      <div className={cn(
        'relative border-b border-[#F5E8C7]/10 px-5 pb-4 pt-[calc(1.5rem+env(safe-area-inset-top))]',
        persistent && 'lg:hidden lg:group-hover/sidebar:block'
      )}>
        {/* Close button — drawer mode only. */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-[calc(1.25rem+env(safe-area-inset-top))] right-4 w-[34px] h-[34px] rounded-full border border-[#F5E8C7]/10 bg-[#F5E8C7]/[0.02] text-[#8A8270] hover:text-[#F5E8C7] flex items-center justify-center transition-colors',
            persistent && 'lg:hidden'
          )}
          aria-label="Close menu"
        >
          <X size={15} weight="bold" />
        </button>
        <div className="font-arabic text-[13px] text-[#E8C97A] tracking-[2px] mb-1.5">عالم رايا</div>
        <h2 className="font-display text-[27px] font-normal leading-[1.05] text-[#F5E8C7]">Raya&rsquo;s Universe</h2>
        <p className="text-[12px] text-[#C9C0A8] font-light leading-snug mt-1.5 pr-8">
          Everything in Zaryah+ lives inside me. Choose where to go.
        </p>
      </div>

      {/* Nav sections — Universe-rail style, all items inline */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide px-2.5 space-y-0.5">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className={cn(
              'text-[10px] font-semibold uppercase tracking-[2px] text-[#4A4639] px-2.5 pt-3.5 pb-1.5',
              persistent && 'lg:hidden lg:group-hover/sidebar:block'
            )}>
              {section.title}
            </p>
            {section.items.map((item) => (
              <SidebarItem
                key={`${section.title}-${item.id}`}
                item={item}
                isActive={isActive(item.path)}
                kycTier={kycTier}
                unreadCount={unreadCount}
                onNav={handleNav}
                persistent={persistent}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer: Logout */}
      <div className="border-t border-[#F5E8C7]/10 py-2.5 px-2.5">
        <button
          onClick={handleLogout}
          className="w-full h-9 flex items-center gap-2.5 rounded-lg px-2.5 text-[#7A7363] hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
        >
          <SignOut size={18} weight="bold" />
          <span className={cn(
            'text-[11px] font-medium',
            persistent && 'lg:hidden lg:group-hover/sidebar:inline'
          )}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
    </>
  );
}
