/**
 * Top navigation bar used inside BarkaLabsPage.
 */

import { useNavigate } from 'react-router-dom';
import { CaretDown, List } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { TOP_NAV_TABS } from '@/features/navigation/types/navigation.types';

interface BarkaTopNavProps {
  isAnonymous: boolean;
  userInitial: string;
  onOpenSidebar: () => void;
  isTabActive: (path: string) => boolean;
  onTopNavClick: (path: string) => void;
}

export function BarkaTopNav({
  isAnonymous, userInitial, onOpenSidebar, isTabActive, onTopNavClick,
}: BarkaTopNavProps) {
  const navigate = useNavigate();

  return (
    <div
      className="sticky top-0 z-50"
      style={{ background: 'rgba(30,41,58,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(215,181,106,0.1)' }}
    >
      <div className="hidden md:flex items-center justify-between px-4 py-3">
        {/* Hamburger menu — only on md (tablet). On lg+ the sidebar is persistent. */}
        <div className="w-[120px] flex items-center">
          <button
            onClick={onOpenSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F5E8C7]/[0.08] transition-colors text-[#C9C0A8] lg:hidden"
            aria-label="Open menu"
          >
            <List size={22} weight="bold" />
          </button>
        </div>

        {/* Pill tabs — centered */}
        <nav className="flex items-center gap-1 rounded-full bg-[#243246] border border-[rgba(215,181,106,0.1)] px-1.5 py-1.5">
          {TOP_NAV_TABS.map((tab) => {
            const active = isTabActive(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => onTopNavClick(tab.path)}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5',
                  active
                    ? 'text-[#0D1016] font-semibold shadow-md'
                    : 'text-[#C9C0A8] hover:text-[#EBDCB8] hover:bg-[#11141C]'
                )}
                style={active ? { background: 'linear-gradient(90deg, #D4A853, #E8C97A)' } : undefined}
              >
                {tab.label}
                {tab.badge && (
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded leading-none',
                    active
                      ? 'bg-[#0D1016]/20 text-[#0D1016]'
                      : 'bg-[#D4A853] text-[#F5E8C7]'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User avatar / Sign up — far right */}
        <div className="w-[120px] flex justify-end">
          {isAnonymous ? (
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)', color: '#0D1016' }}
            >
              Sign Up
            </button>
          ) : (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#D4A853] text-[#F5E8C7] text-sm font-bold flex items-center justify-center">
                {userInitial}
              </div>
              <CaretDown size={12} className="text-[#C9C0A8]" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: simplified bar with hamburger */}
      <div className="flex md:hidden items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F5E8C7]/[0.08] transition-colors text-[#C9C0A8]"
            aria-label="Open menu"
          >
            <List size={22} weight="bold" />
          </button>
          <span className="text-sm font-bold" style={{ color: '#D4A853', fontFamily: 'Cormorant Garamond, serif' }}>
            Barakah Labs
          </span>
        </div>
        {isAnonymous ? (
          <button
            onClick={() => navigate('/signup')}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)', color: '#0D1016' }}
          >
            Sign Up
          </button>
        ) : (
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full bg-[#D4A853] text-[#F5E8C7] text-xs font-bold flex items-center justify-center"
          >
            {userInitial}
          </button>
        )}
      </div>
    </div>
  );
}
