/**
 * RayaStarCanvas — ambient connected-particle starfield (ported from the
 * raya-os mockup). Pure atmosphere; pointer-events:none. Honours
 * prefers-reduced-motion (draws a single static frame instead of animating).
 */

import { useEffect, useRef } from 'react';

export function RayaStarCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    let W = 0;
    let H = 0;
    let pts: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    const init = () => {
      pts = [];
      const n = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 22000));
      for (let i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.12 * dpr,
          vy: (Math.random() - 0.5) * 0.12 * dpr,
          r: (Math.random() * 1.2 + 0.4) * dpr,
        });
      }
    };

    const resize = () => {
      W = cv.width = window.innerWidth * dpr;
      H = cv.height = window.innerHeight * dpr;
      cv.style.width = window.innerWidth + 'px';
      cv.style.height = window.innerHeight + 'px';
      init();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const maxD = 130 * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = 'rgba(212,168,83,0.42)';
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(212,168,83,' + 0.1 * (1 - d / maxD) + ')';
            ctx.lineWidth = dpr * 0.6;
            ctx.stroke();
          }
        }
        const mdx = p.x - mouse.x * dpr;
        const mdy = p.y - mouse.y * dpr;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < maxD * 1.5) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x * dpr, mouse.y * dpr);
          ctx.strokeStyle = 'rgba(232,201,122,' + 0.16 * (1 - md / (maxD * 1.5)) + ')';
          ctx.lineWidth = dpr * 0.7;
          ctx.stroke();
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
