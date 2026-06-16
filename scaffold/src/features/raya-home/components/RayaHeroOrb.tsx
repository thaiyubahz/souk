/**
 * RayaHeroOrb — the breathing gold orb as a *static* hero centrepiece for the
 * Raya gateway. Same visual language as the floating navigator orb
 * (RayaGatewayOrb) but in-flow, non-interactive (pointer-events:none) and not
 * draggable — purely decorative.
 *
 * When the user enters chat mode the hero is removed, and the orb takes that as
 * its cue to *fly off*: it weaves a short, playful path and shrinks away to a
 * different random spot each time (the flight is randomised per mount). The
 * floating, clickable navigator orb is unchanged elsewhere (MainLayout).
 */

import { useMemo } from 'react';
import { motion, type TargetAndTransition } from 'framer-motion';

/**
 * A fresh, randomised "orbit in a smooth circle, then peel off and leave" path
 * — different every mount. It does NOT fade: it stays solid the whole way and
 * leaves by travelling past a random edge (the page root clips it there).
 *
 * The circle is sampled into many points so it reads as a real, smooth orbit
 * (not a polygon of waypoints). It's scaled to the viewport and centred just
 * below the orb's resting spot so the loop stays on-screen, then at a random
 * moment it breaks off and strolls out a random edge.
 */
function makeFlight(): TargetAndTransition {
  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const H = typeof window !== 'undefined' ? window.innerHeight : 800;
  const rx = W * 0.3; // horizontal radius
  const ry = H * 0.3; // vertical radius
  const dir = Math.random() < 0.5 ? 1 : -1; // orbit clockwise / anti-clockwise
  const turns = 1 + Math.random() * 0.4; // ~1–1.4 laps before leaving
  const steps = 40;

  // Circle centred (0, ry) below the resting spot; start at its top so the
  // first sample is exactly the orb's resting position (0,0).
  const xs: number[] = [];
  const ys: number[] = [];
  const times: number[] = [];
  const LOOP_END = 0.8; // 80% of the time is the orbit, last 20% strolls out
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = -Math.PI / 2 + dir * t * turns * Math.PI * 2;
    xs.push(rx * Math.cos(ang));
    ys.push(ry * (1 + Math.sin(ang)));
    times.push(t * LOOP_END);
  }

  // Break off and leave past a random edge.
  const edge = Math.floor(Math.random() * 4); // 0 top · 1 right · 2 bottom · 3 left
  const lateral = (Math.random() - 0.5) * W * 0.5;
  const end =
    edge === 0 ? { x: lateral, y: -H * 0.9 }
    : edge === 1 ? { x: W * 0.9, y: lateral }
    : edge === 2 ? { x: lateral, y: H }
    : { x: -W * 0.9, y: lateral };
  xs.push(end.x);
  ys.push(end.y);
  times.push(1);

  const n = xs.length;
  return {
    x: xs,
    y: ys,
    rotate: xs.map((_, i) => dir * i * 11),
    scale: xs.map((_, i) => (i === n - 1 ? 0.8 : 1.04)),
    // 'linear' keeps the orbit at a steady, even pace.
    transition: { duration: 2.8, ease: 'linear', times },
  };
}

export function RayaHeroOrb() {
  const flight = useMemo(() => makeFlight(), []);
  return (
    <motion.div
      className="rho-wrap"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={flight}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <style>{HERO_ORB_CSS}</style>
      <div className="rho-orb">
        <span className="rho-glow" />
        <span className="rho-ring" />
        <span className="rho-core">
          <span className="rho-eye" />
          <span className="rho-eye" />
        </span>
        <span className="rho-spark rho-s1" />
        <span className="rho-spark rho-s2" />
        <span className="rho-spark rho-s3" />
      </div>
    </motion.div>
  );
}

const HERO_ORB_CSS = `
.rho-wrap{display:flex;align-items:center;justify-content:center;margin-bottom:26px;pointer-events:none;}
.rho-orb{position:relative;width:84px;height:84px;display:flex;align-items:center;justify-content:center;}
.rho-glow{position:absolute;inset:-22px;border-radius:50%;background:radial-gradient(circle, rgba(212,168,83,0.5), rgba(42,157,111,0.18) 55%, transparent 72%);filter:blur(9px);animation:rhoGlow 4s cubic-bezier(.16,1,.3,1) infinite;}
.rho-ring{position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(from 0deg, #E8C97A, #2A9D6F, #D4A853, #E8C97A);-webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));mask:radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));animation:rhoSpin 9s linear infinite;opacity:.85;}
.rho-core{position:relative;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle at 36% 30%, #fff4d8 0%, #E8C97A 26%, #D4A853 52%, #9a7430 90%),radial-gradient(circle at 70% 78%, rgba(42,157,111,0.55), transparent 55%);box-shadow:inset 0 0 16px rgba(255,255,255,0.35), inset -7px -9px 20px rgba(60,40,10,0.5), 0 8px 26px rgba(0,0,0,0.4);animation:rhoBreathe 4s cubic-bezier(.16,1,.3,1) infinite;display:flex;align-items:center;justify-content:center;gap:10px;}
.rho-eye{width:6px;height:12px;border-radius:50%;background:#3a2a0e;box-shadow:0 0 4px rgba(0,0,0,0.4);animation:rhoBlink 5.2s infinite;}
.rho-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#E8C97A;box-shadow:0 0 8px #E8C97A;top:50%;left:50%;}
.rho-s1{animation:rhoOrbit1 7s linear infinite;}
.rho-s2{animation:rhoOrbit2 10s linear infinite;width:3.5px;height:3.5px;background:#2A9D6F;box-shadow:0 0 8px #2A9D6F;}
.rho-s3{animation:rhoOrbit3 13s linear infinite;width:3px;height:3px;}
@keyframes rhoBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}
@keyframes rhoGlow{0%,100%{opacity:.7;transform:scale(1);}50%{opacity:1;transform:scale(1.12);}}
@keyframes rhoSpin{to{transform:rotate(360deg);}}
@keyframes rhoBlink{0%,92%,100%{transform:scaleY(1);}95%{transform:scaleY(.1);}}
@keyframes rhoOrbit1{from{transform:rotate(0) translateX(46px) rotate(0);}to{transform:rotate(360deg) translateX(46px) rotate(-360deg);}}
@keyframes rhoOrbit2{from{transform:rotate(120deg) translateX(52px) rotate(-120deg);}to{transform:rotate(480deg) translateX(52px) rotate(-480deg);}}
@keyframes rhoOrbit3{from{transform:rotate(240deg) translateX(40px) rotate(-240deg);}to{transform:rotate(600deg) translateX(40px) rotate(-600deg);}}
@media (max-width:760px){.rho-orb{width:74px;height:74px;}.rho-core{width:62px;height:62px;}}
@media (prefers-reduced-motion:reduce){.rho-glow,.rho-ring,.rho-core,.rho-eye,.rho-spark{animation:none!important;}}
`;
