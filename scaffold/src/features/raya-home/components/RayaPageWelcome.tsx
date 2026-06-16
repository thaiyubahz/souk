/**
 * RayaPageWelcome — the floating dock's first-visit welcome card.
 *
 * The first time a user reaches a feature area, Raya pops this card from her orb
 * with a short summary of the place + a few things they can do here. It's shown
 * once per area (the dock tracks "seen" guides in localStorage), never randomly.
 *
 * Purely presentational — the dock owns the when/whether and the seen-tracking.
 */

import { type CSSProperties } from 'react';
import { X } from '@phosphor-icons/react';
import type { PageGuide } from '../data/pageGuides';

interface RayaPageWelcomeProps {
  guide: PageGuide;
  /** First time ever seeing the dock — folds in the "I'm your navigator" tip. */
  firstRun?: boolean;
  /** Lift above the mobile bottom nav when used as the in-app dock. */
  inApp?: boolean;
  /** Anchor next to a dragged orb (matches the chat popup's anchoring). */
  anchorStyle?: CSSProperties;
  onDismiss: () => void;
  /** "Show me around" → opens the chat popup. */
  onOpenChat: () => void;
}

export function RayaPageWelcome({
  guide,
  firstRun = false,
  inApp,
  anchorStyle,
  onDismiss,
  onOpenChat,
}: RayaPageWelcomeProps) {
  return (
    <>
      <style>{WELCOME_CSS}</style>
      <div
        role="dialog"
        aria-label={`About ${guide.title}`}
        style={anchorStyle}
        className={`rpw${inApp ? ' rpw-inapp' : ''}`}
      >
        <button className="rpw-x" onClick={onDismiss} aria-label="Dismiss">
          <X size={15} />
        </button>

        <div className="rpw-head">
          <span className="rpw-orb" />
          <div className="rpw-head-t">
            <span className="rpw-eyebrow">
              Raya{guide.soon && <span className="rpw-soon">Coming soon</span>}
            </span>
            <h3 className="rpw-title">{guide.title}</h3>
          </div>
        </div>

        <p className="rpw-summary">{guide.summary}</p>

        {guide.highlights.length > 0 && (
          <ul className="rpw-list">
            {guide.highlights.map((h) => (
              <li key={h}>
                <span className="rpw-dot" aria-hidden>✦</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        {firstRun && (
          <p className="rpw-nav">
            Tip: I float on every page — tap me anytime and tell me where to go.
          </p>
        )}

        <div className="rpw-actions">
          <button className="rpw-ghost" onClick={onDismiss}>
            Got it
          </button>
          <button className="rpw-cta" onClick={onOpenChat}>
            Ask me about this →
          </button>
        </div>
      </div>
    </>
  );
}

const WELCOME_CSS = `
.rpw{position:fixed;right:30px;bottom:118px;z-index:47;width:min(340px,calc(100vw - 36px));
  display:flex;flex-direction:column;gap:11px;padding:18px 18px 16px;border-radius:20px;
  background:rgba(6,8,13,0.97);border:1px solid rgba(212,168,83,0.22);backdrop-filter:blur(20px);
  box-shadow:0 30px 80px -20px rgba(0,0,0,0.85);
  animation:rpwIn .45s cubic-bezier(.16,1,.3,1) both;}
.rpw-inapp{bottom:118px;}
.rpw-x{position:absolute;top:12px;right:12px;color:#8A8270;display:flex;}
.rpw-x:hover{color:#F5E8C7;}
.rpw-head{display:flex;align-items:center;gap:11px;padding-right:22px;}
.rpw-orb{width:34px;height:34px;border-radius:50%;flex:0 0 auto;
  background:radial-gradient(circle at 35% 30%, #E8C97A, #D4A853 45%, #2A9D6F 120%);
  box-shadow:0 0 14px rgba(212,168,83,0.45), inset 0 0 7px rgba(255,255,255,0.25);}
.rpw-head-t{display:flex;flex-direction:column;gap:1px;min-width:0;}
.rpw-eyebrow{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8A8270;}
.rpw-soon{font-size:9px;letter-spacing:.5px;color:#E8C97A;border:1px solid rgba(212,168,83,0.35);background:rgba(212,168,83,0.1);padding:1px 6px;border-radius:999px;}
.rpw-title{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:500;color:#F5E8C7;line-height:1.1;}
.rpw-summary{font-size:13.5px;line-height:1.6;font-weight:300;color:#D8CDB0;}
.rpw-list{display:flex;flex-direction:column;gap:7px;margin:1px 0 2px;}
.rpw-list li{display:flex;align-items:flex-start;gap:9px;font-size:13px;line-height:1.45;color:#C9C0A8;}
.rpw-dot{color:#E8C97A;font-size:11px;line-height:1.5;flex:0 0 auto;}
.rpw-nav{font-size:12px;line-height:1.5;color:#8A8270;border-top:1px solid rgba(245,232,199,0.07);padding-top:10px;}
.rpw-actions{display:flex;align-items:center;gap:9px;margin-top:3px;}
.rpw-ghost{flex:0 0 auto;font-size:12.5px;color:#C9C0A8;padding:8px 14px;border-radius:11px;border:1px solid rgba(245,232,199,0.12);background:rgba(245,232,199,0.02);transition:.2s;}
.rpw-ghost:hover{color:#F5E8C7;border-color:rgba(245,232,199,0.25);}
.rpw-cta{flex:1;font-size:12.5px;font-weight:500;color:#1a1206;padding:8px 14px;border-radius:11px;
  background:linear-gradient(135deg,#E8C97A,#D4A853);transition:.2s;}
.rpw-cta:hover{filter:brightness(1.08);}
@keyframes rpwIn{from{opacity:0;transform:translateY(16px) scale(.97);}to{opacity:1;transform:none;}}
@media (max-width:760px){.rpw{right:18px;bottom:96px;}.rpw.rpw-inapp{bottom:158px;}}
@media (prefers-reduced-motion:reduce){.rpw{animation-duration:.15s;}}
`;
