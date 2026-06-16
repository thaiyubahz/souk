/**
 * Formatting helpers for the Raya hub + dashboard tabs.
 *
 * Kept in a non-component module so `ui.tsx` only exports components — the
 * react-refresh/only-export-components rule (enforced via `eslint
 * --max-warnings 0` in the prod deploy) fails the build otherwise.
 */

/** Relative-ish timestamp: "Today 3:40 PM", "Yesterday", or a short date. */
export function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today ${time}`;
  if (isYest) return `Yesterday ${time}`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ` ${time}`;
}

/** A stable per-day key (YYYY-MM-DD in local time) used to split a transcript. */
export function dayKey(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

/** Date-divider label for a transcript: "Today", "Yesterday", or "4 June 2026". */
export function fmtDayLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}
