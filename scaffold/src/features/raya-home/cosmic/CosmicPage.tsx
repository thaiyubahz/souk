/**
 * CosmicPage — content wrapper for a redesigned page that renders INSIDE the
 * cosmic app shell (MainLayout provides the starfield, topbar and Raya dock).
 * Just a centered max-width column with an optional serif page header.
 *
 * (Standalone full-bleed pages — the gateway — use CosmicLayout instead, which
 * brings its own chrome.)
 */

import type { ReactNode } from 'react';

interface CosmicPageProps {
  children: ReactNode;
  ar?: string;
  title?: string;
  subtitle?: string;
  maxWidth?: number;
}

export function CosmicPage({ children, ar, title, subtitle, maxWidth = 960 }: CosmicPageProps) {
  return (
    <div className="mx-auto w-full px-5 sm:px-7 pb-28 pt-6" style={{ maxWidth }}>
      {(title || ar) && (
        <div className="mb-7">
          {ar && <div className="font-arabic text-[22px] text-[#D4A853] opacity-90 mb-1.5">{ar}</div>}
          {title && (
            <h1 className="font-display text-[clamp(30px,4.4vw,42px)] font-normal leading-[1.05] text-[#F5E8C7]">
              {title}
            </h1>
          )}
          {subtitle && <p className="font-display italic text-[16px] text-[#C9C0A8] mt-2">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
