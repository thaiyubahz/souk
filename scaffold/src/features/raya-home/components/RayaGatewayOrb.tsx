/**
 * RayaGatewayOrb — the breathing gold orb gateway (ported from raya-os).
 * Conic ring, pulsing glow, blinking eyes, orbiting sparks. Self-contained CSS
 * so it doesn't depend on any global stylesheet. `active` tightens it when the
 * universe rail is open.
 */

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

interface RayaGatewayOrbProps {
  onClick: () => void;
  active?: boolean;
  /** Lift above the mobile bottom nav when used as the global in-app dock. */
  inApp?: boolean;
  /** Inline position override (left/top) when the orb has been dragged. */
  style?: CSSProperties;
  /** True while dragging — disables transitions and shows the grab cursor. */
  dragging?: boolean;
  onPointerDown?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}

export function RayaGatewayOrb({
  onClick, active, inApp, style, dragging, onPointerDown, onPointerMove, onPointerUp,
}: RayaGatewayOrbProps) {
  return (
    <>
      <style>{ORB_CSS}</style>
      <button
        type="button"
        aria-label="Open Raya's universe"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={style}
        className={`rgo-orb${active ? ' rgo-active' : ''}${inApp ? ' rgo-inapp' : ''}${dragging ? ' rgo-dragging' : ''}`}
      >
        <span className="rgo-glow" />
        <span className="rgo-ring" />
        <span className="rgo-core">
          <span className="rgo-eye" />
          <span className="rgo-eye" />
        </span>
        <span className="rgo-spark rgo-s1" />
        <span className="rgo-spark rgo-s2" />
        <span className="rgo-spark rgo-s3" />
      </button>
    </>
  );
}

const ORB_CSS = `
.rgo-orb{position:fixed;right:30px;bottom:30px;z-index:46;width:74px;height:74px;border:none;background:none;cursor:grab;display:flex;align-items:center;justify-content:center;transition:transform .4s cubic-bezier(.16,1,.3,1);touch-action:none;}
.rgo-dragging{cursor:grabbing!important;transition:none!important;}
.rgo-orb:hover{transform:scale(1.07);}
.rgo-orb:active{transform:scale(.96);}
.rgo-glow{position:absolute;inset:-18px;border-radius:50%;background:radial-gradient(circle, rgba(212,168,83,0.5), rgba(42,157,111,0.18) 55%, transparent 72%);filter:blur(8px);animation:rgoGlow 4s cubic-bezier(.16,1,.3,1) infinite;}
.rgo-ring{position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(from 0deg, #E8C97A, #2A9D6F, #D4A853, #E8C97A);-webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));mask:radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));animation:rgoSpin 9s linear infinite;opacity:.85;}
.rgo-core{position:relative;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 36% 30%, #fff4d8 0%, #E8C97A 26%, #D4A853 52%, #9a7430 90%),radial-gradient(circle at 70% 78%, rgba(42,157,111,0.55), transparent 55%);box-shadow:inset 0 0 14px rgba(255,255,255,0.35), inset -6px -8px 18px rgba(60,40,10,0.5), 0 8px 24px rgba(0,0,0,0.4);animation:rgoBreathe 4s cubic-bezier(.16,1,.3,1) infinite;display:flex;align-items:center;justify-content:center;gap:9px;}
.rgo-eye{width:5.5px;height:11px;border-radius:50%;background:#3a2a0e;box-shadow:0 0 4px rgba(0,0,0,0.4);animation:rgoBlink 5.2s infinite;}
.rgo-orb:hover .rgo-eye{height:7px;}
.rgo-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#E8C97A;box-shadow:0 0 8px #E8C97A;top:50%;left:50%;}
.rgo-s1{animation:rgoOrbit1 7s linear infinite;}
.rgo-s2{animation:rgoOrbit2 10s linear infinite;width:3.5px;height:3.5px;background:#2A9D6F;box-shadow:0 0 8px #2A9D6F;}
.rgo-s3{animation:rgoOrbit3 13s linear infinite;width:3px;height:3px;}
.rgo-active .rgo-ring{animation-duration:3.5s;}
.rgo-active .rgo-core{box-shadow:inset 0 0 16px rgba(255,255,255,0.45), inset -6px -8px 18px rgba(60,40,10,0.5), 0 0 28px rgba(212,168,83,0.5);}
@keyframes rgoBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}
@keyframes rgoGlow{0%,100%{opacity:.7;transform:scale(1);}50%{opacity:1;transform:scale(1.12);}}
@keyframes rgoSpin{to{transform:rotate(360deg);}}
@keyframes rgoBlink{0%,92%,100%{transform:scaleY(1);}95%{transform:scaleY(.1);}}
@keyframes rgoOrbit1{from{transform:rotate(0) translateX(40px) rotate(0);}to{transform:rotate(360deg) translateX(40px) rotate(-360deg);}}
@keyframes rgoOrbit2{from{transform:rotate(120deg) translateX(46px) rotate(-120deg);}to{transform:rotate(480deg) translateX(46px) rotate(-480deg);}}
@keyframes rgoOrbit3{from{transform:rotate(240deg) translateX(34px) rotate(-240deg);}to{transform:rotate(600deg) translateX(34px) rotate(-600deg);}}
@media (max-width:760px){.rgo-orb{right:18px;bottom:18px;width:64px;height:64px;}.rgo-core{width:52px;height:52px;}.rgo-orb.rgo-inapp{bottom:84px;}}
@media (prefers-reduced-motion:reduce){.rgo-glow,.rgo-ring,.rgo-core,.rgo-eye,.rgo-spark{animation:none!important;}}
`;
