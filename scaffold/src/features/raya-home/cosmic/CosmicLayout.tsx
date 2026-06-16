/**
 * CosmicLayout — the reusable "Raya universe" page shell.
 *
 * Wraps any page in the gateway's celestial aesthetic: animated starfield +
 * ambient gold/emerald washes over deep night, a slim topbar (hamburger →
 * Raya's Universe menu, optional back, wordmark, status), and the floating Raya
 * orb dock. Drop page content in as children — it scrolls over the cosmos.
 *
 * This is the foundation for redesigning every feature page to match the
 * gateway. Preview pages use it full-bleed (outside MainLayout).
 */

import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, List } from '@phosphor-icons/react';
import { RayaStarCanvas } from '../components/RayaStarCanvas';
import { RayaUniverseRail } from '../components/RayaUniverseRail';
import { RayaGlobalDock } from '../components/RayaGlobalDock';
import { playWarp } from '../warpTransition';
import type { GatewayFeature } from '../data/gatewayFeatures';

interface CosmicLayoutProps {
  children: ReactNode;
  /** Arabic eyebrow above the title (optional). */
  ar?: string;
  /** Page title shown in the header band (optional — omit for a bare shell). */
  title?: string;
  /** Italic serif subtitle under the title (optional). */
  subtitle?: string;
  /** Show a "back" affordance in the topbar. */
  showBack?: boolean;
  /** Constrain content width (default 960). */
  maxWidth?: number;
}

export function CosmicLayout({
  children,
  ar,
  title,
  subtitle,
  showBack,
  maxWidth = 960,
}: CosmicLayoutProps) {
  const navigate = useNavigate();
  const [railOpen, setRailOpen] = useState(false);

  const onRailSelect = (f: GatewayFeature) => {
    setRailOpen(false);
    playWarp({
      origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      accent: '#D4A853',
      onCover: () => navigate(f.route),
    });
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06080D] text-[#F5E8C7] font-sans">
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
            onClick={() => setRailOpen(true)}
            aria-label="Open Raya's Universe menu"
            className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[#C9C0A8] border border-[#F5E8C7]/10 bg-[#F5E8C7]/[0.02] hover:text-[#F5E8C7] hover:border-[#D4A853]/40 transition-colors"
          >
            <List size={18} weight="bold" />
          </button>
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[#C9C0A8] border border-[#F5E8C7]/10 bg-[#F5E8C7]/[0.02] hover:text-[#F5E8C7] hover:border-[#D4A853]/40 transition-colors"
            >
              <ArrowLeft size={17} weight="bold" />
            </button>
          )}
          <button onClick={() => navigate('/')} className="font-display text-[25px] font-medium tracking-[0.3px] text-[#F5E8C7]">
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
      <main className="fixed inset-x-0 bottom-0 top-[60px] z-[5] overflow-y-auto">
        <div className="mx-auto w-full px-5 sm:px-7 pb-28 pt-6" style={{ maxWidth }}>
          {(title || ar) && (
            <div className="mb-7">
              {ar && <div className="font-arabic text-[22px] text-[#D4A853] opacity-90 mb-1.5">{ar}</div>}
              {title && (
                <h1 className="font-display text-[clamp(30px,4.4vw,42px)] font-normal leading-[1.05] text-[#F5E8C7]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="font-display italic text-[16px] text-[#C9C0A8] mt-2">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>

      <RayaUniverseRail open={railOpen} onClose={() => setRailOpen(false)} onSelect={onRailSelect} />
      <RayaGlobalDock inApp={false} />
    </div>
  );
}
