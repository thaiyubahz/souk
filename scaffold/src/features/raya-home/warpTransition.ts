/**
 * warpTransition.ts — the "Nūr Ripple" navigation transition (dark & celestial).
 *
 * On-theme with the gateway's night-sky aesthetic: the screen settles into deep
 * night (which also matches the dark destination pages, so the swap is seamless)
 * while Raya's light ripples outward from the orb as thin concentric gold rings,
 * with a soft halo and a few sparks of starlight. Gold stays an accent — never a
 * full-screen flash.
 *
 * We navigate while the dark veil fully covers the screen (hiding the lazy-route
 * load), then dissolve to reveal the destination. Raw DOM + Web Animations API
 * so it survives the React Router unmount mid-transition.
 */

interface WarpOptions {
  /** Where the ripple originates (defaults to the orb, bottom-right). */
  origin?: { x: number; y: number };
  /** Accent that tints the rings/halo — pass the destination feature's accent. */
  accent?: string;
  /** Called once the screen is fully covered — do the navigate() here. */
  onCover: () => void;
}

const COVER_MS = 640;
const HOLD_MS = 440; // opaque while the new (lazy) page mounts → no flash
const REVEAL_MS = 700;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function playWarp({ origin, accent = '#D4A853', onCover }: WarpOptions): void {
  if (typeof document === 'undefined' || prefersReducedMotion()) {
    onCover();
    return;
  }

  const ox = origin?.x ?? window.innerWidth - 52;
  const oy = origin?.y ?? window.innerHeight - 52;
  const maxR =
    Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)) * 1.15;
  const [r, g, b] = hexToRgb(accent);
  const rgb = `${r},${g},${b}`;

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;';

  // 1) Veil — a gentle gold breath at the origin that deepens into night.
  const veil = document.createElement('div');
  veil.style.cssText =
    `position:absolute;inset:0;opacity:0;will-change:opacity;` +
    `background:radial-gradient(circle at ${ox}px ${oy}px, rgba(${rgb},0.22) 0%, rgba(${rgb},0.08) 28%, #0A0E16 52%, #05070C 100%);`;

  // 2) Soft halo glow at the origin (blurred, gold) — Raya's light.
  const halo = document.createElement('div');
  halo.style.cssText =
    `position:absolute;left:${ox}px;top:${oy}px;width:380px;height:380px;margin:-190px 0 0 -190px;` +
    `border-radius:50%;opacity:0;will-change:transform,opacity;filter:blur(20px);` +
    `background:radial-gradient(circle, rgba(${rgb},0.45), rgba(${rgb},0.12) 55%, transparent 72%);`;

  overlay.appendChild(veil);
  overlay.appendChild(halo);

  // 3) Concentric gold rings rippling out from the orb.
  const RINGS = 4;
  const ringBase = 120;
  const coverScale = (maxR * 2) / ringBase;
  const rings: HTMLDivElement[] = [];
  for (let i = 0; i < RINGS; i++) {
    const ring = document.createElement('div');
    ring.style.cssText =
      `position:absolute;left:${ox}px;top:${oy}px;width:${ringBase}px;height:${ringBase}px;` +
      `margin:-${ringBase / 2}px 0 0 -${ringBase / 2}px;border-radius:50%;` +
      `border:1.75px solid rgba(${rgb},0.6);box-shadow:0 0 20px rgba(${rgb},0.3);` +
      `opacity:0;will-change:transform,opacity;`;
    overlay.appendChild(ring);
    rings.push(ring);
  }

  // 4) Sparks of starlight drifting in.
  const SPARKS = 18;
  for (let i = 0; i < SPARKS; i++) {
    const s = document.createElement('div');
    const sx = Math.random() * window.innerWidth;
    const sy = Math.random() * window.innerHeight;
    const size = Math.random() * 1.6 + 0.8;
    s.style.cssText =
      `position:absolute;left:${sx}px;top:${sy}px;width:${size}px;height:${size}px;border-radius:50%;` +
      `background:#E8C97A;box-shadow:0 0 6px rgba(232,201,122,0.8);opacity:0;will-change:opacity,transform;`;
    overlay.appendChild(s);
    s.animate(
      [
        { opacity: 0, transform: 'scale(0.4)' },
        { opacity: 0.85, transform: 'scale(1)', offset: 0.5 },
        { opacity: 0, transform: 'scale(1.4)' },
      ],
      { duration: COVER_MS + 260, delay: Math.random() * 220, easing: 'ease-in-out', fill: 'forwards' },
    );
  }

  document.body.appendChild(overlay);

  const ease = 'cubic-bezier(.4,0,.2,1)';

  veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: COVER_MS, easing: ease, fill: 'forwards' });
  halo.animate(
    [
      { opacity: 0, transform: 'scale(0.4)' },
      { opacity: 0.85, transform: 'scale(1.1)', offset: 0.55 },
      { opacity: 0, transform: 'scale(1.8)' },
    ],
    { duration: COVER_MS + 120, easing: 'ease-out', fill: 'forwards' },
  );

  rings.forEach((ring, i) => {
    ring.animate(
      [
        { opacity: 0, transform: 'scale(0.08)' },
        { opacity: 0.75, offset: 0.24 },
        { opacity: 0, transform: `scale(${coverScale})` },
      ],
      { duration: COVER_MS + 220, delay: i * 140, easing: 'cubic-bezier(.2,.6,.2,1)', fill: 'forwards' },
    );
  });

  const cover = veil.animate([{ opacity: 1 }], { duration: 1, delay: COVER_MS, fill: 'forwards' });
  cover.onfinish = () => {
    onCover(); // swap route, hidden behind the dark veil
    window.setTimeout(() => {
      const reveal = overlay.animate(
        [
          { opacity: 1, filter: 'blur(0px)' },
          { opacity: 0, filter: 'blur(5px)' },
        ],
        { duration: REVEAL_MS, easing: 'ease', fill: 'forwards' },
      );
      reveal.onfinish = () => overlay.remove();
      window.setTimeout(() => overlay.remove(), REVEAL_MS + 400); // safety
    }, HOLD_MS);
  };
}
