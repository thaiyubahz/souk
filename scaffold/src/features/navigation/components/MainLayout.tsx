/**
 * Main Layout Shell — the "Raya universe" cosmic shell.
 *
 * Every authenticated page renders inside this: an animated starfield + ambient
 * gold/emerald washes over deep night, a slim topbar (hamburger → full nav
 * drawer, wordmark, status), the floating Raya orb dock, and a scrollable
 * content area. This replaces the old sidebar/top-nav/bottom-nav chrome so the
 * whole app matches the gateway. Navigation is via the hamburger drawer and Raya.
 *
 * All the app-shell logic (notifications, disclaimers, walkthrough, KYC, scroll
 * reset, feature logging) is preserved.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { List } from '@phosphor-icons/react';
import { Sidebar } from './Sidebar';
import { FirstLaunchDisclaimerModal } from '@/components/shared';
// import { AppWalkthrough } from '@/components/shared'; // walkthrough disabled for now
import { LegacyCreditModal } from '@/features/wallet/components/LegacyCreditModal';
import { RayaStarCanvas } from '@/features/raya-home/components/RayaStarCanvas';
import { RayaGlobalDock } from '@/features/raya-home/components/RayaGlobalDock';
import { logFeatureVisit } from '@/lib/analytics';
import { useDisclaimerSeen } from '@/features/legal/hooks/useDisclaimerSeen';
// import { useWalkthroughSeen } from '@/components/shared/useWalkthroughSeen'; // walkthrough disabled for now
import { useNotificationStore } from '@/features/notifications/stores/notification.store';
import { useKycStore } from '@/features/kyc/stores/kyc.store';

export function MainLayout() {
  const [firstLaunchSeen, markFirstLaunchSeen] = useDisclaimerSeen('first_launch');
  // const [walkthroughSeen, markWalkthroughSeen] = useWalkthroughSeen(); // walkthrough disabled for now
  const { initialize, dispose } = useNotificationStore();
  const kycTier = useKycStore((s) => s.kycTier);
  const kycInitialized = useKycStore((s) => s.initialized);
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname === '/ai-assistant';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const mainRef = useRef<HTMLElement>(null);

  // Close nav drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Reset content scroll to top on every route change.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  // Track feature usage
  useEffect(() => {
    logFeatureVisit(location.pathname);
  }, [location.pathname]);

  // Initialize notification subscription for unread badge count.
  // Skip if KYC Tier 0 — AuthGuard redirects to /quick-kyc, unmounting this layout.
  useEffect(() => {
    if (!kycInitialized || kycTier === 0) return;
    initialize();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable zustand actions; re-subscribe only when KYC gate flips
  }, [kycInitialized, kycTier]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06080D] text-[#F5E8C7] font-sans">
      {/* Cosmic atmosphere */}
      <RayaStarCanvas />
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 8%, rgba(212,168,83,0.10), transparent 60%),' +
            'radial-gradient(ellipse 60% 60% at 92% 88%, rgba(42,157,111,0.09), transparent 65%),' +
            'radial-gradient(ellipse 50% 50% at 6% 92%, rgba(212,168,83,0.05), transparent 70%)',
        }}
      />

      {/* Topbar */}
      <header className="fixed top-0 inset-x-0 h-[60px] z-40 flex items-center justify-between px-[18px] sm:px-[26px] backdrop-blur-[14px] bg-gradient-to-b from-[#06080D]/85 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            aria-label="Open menu"
            className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[#C9C0A8] border border-[#F5E8C7]/10 bg-[#F5E8C7]/[0.02] hover:text-[#F5E8C7] hover:border-[#D4A853]/40 transition-colors"
          >
            <List size={18} weight="bold" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="font-display text-[25px] font-medium tracking-[0.3px] text-[#F5E8C7]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Zaryah<b className="text-[#D4A853] font-semibold">+</b>
            <span className="font-arabic text-[14px] text-[#8A8270] ml-2.5 hidden sm:inline">زريّة</span>
          </button>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-[12px] text-[#C9C0A8] tracking-[0.4px] px-3 py-[7px] border border-[#F5E8C7]/10 rounded-full bg-[#F5E8C7]/[0.02]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D6F] shadow-[0_0_8px_#2A9D6F] animate-pulse" />
          Raya is awake
        </span>
      </header>

      {/* Scrollable content over the cosmos */}
      <main ref={mainRef} className="fixed inset-x-0 bottom-0 top-[60px] z-[5] overflow-y-auto">
        <Outlet />
      </main>

      {/* Full navigation drawer (all sections) — opened by the hamburger. */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Floating Raya orb + chat — on every page except the dedicated chat. */}
      {!isChatPage && <RayaGlobalDock inApp={false} />}

      {!firstLaunchSeen && <FirstLaunchDisclaimerModal onAccept={markFirstLaunchSeen} />}

      {/* App walkthrough — disabled for now (misaligned with the new layout).
      {firstLaunchSeen && !walkthroughSeen && !isChatPage && (
        <AppWalkthrough onComplete={markWalkthroughSeen} />
      )} */}

      {/* Legacy DNZ restoration — one-time claim for pre-existing investors. */}
      {firstLaunchSeen && <LegacyCreditModal />}

      {/* Version badge for incident triage. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-1 right-1 z-50 select-none rounded px-1.5 py-0.5 font-mono text-[8px] text-[#5C5749]/40"
        title={`Build ${__APP_VERSION__}`}
      >
        v{__APP_VERSION__}
      </div>
    </div>
  );
}
