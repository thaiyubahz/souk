/**
 * EimWelcome — a one-time framing moment shown the first time a user opens the
 * EIM home. The goal is the first 30 seconds: set the identity (Learn → Practice
 * → Reflect), the promise (halal investing, no real money), and the calm,
 * anti-hype tone — so EIM feels considered and memorable, not like a trading app.
 *
 * Shown once per device, tracked via the shared eim.store.featureIntros slice
 * under the key 'home-welcome'. Re-openable is not needed here (the per-feature
 * "i" cards carry the on-demand explanations); this is purely a first impression.
 */

import { useEffect, useState } from 'react';
import { GraduationCap, Rewind, Scales, X } from '@phosphor-icons/react';
import { useEimStore } from '../stores/eim.store';

const WELCOME_KEY = 'home-welcome';

const PILLARS = [
  {
    icon: GraduationCap,
    title: 'Learn',
    body: 'A course that builds from foundations to mastery — the halal way to think about money.',
  },
  {
    icon: Rewind,
    title: 'Practice',
    body: 'Replay real market history and make decisions with virtual cash. Mistakes here are free.',
  },
  {
    icon: Scales,
    title: 'Reflect',
    body: 'A mentor and a mirror that help you weigh your choices — with ethics, not hype.',
  },
];

export function EimWelcome() {
  const markSeen = useEimStore((s) => s.markFeatureIntroSeen);
  const [open, setOpen] = useState(() => !useEimStore.getState().featureIntros[WELCOME_KEY]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    markSeen(WELCOME_KEY);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to the Ethical Investment Mentor"
        className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-[rgba(212,168,83,0.30)] bg-[#101a2a] shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5749] hover:text-[#F5E8C7]"
        >
          <X size={16} weight="bold" />
        </button>

        {/* Hero */}
        <div
          className="px-6 pt-7 pb-5 text-center"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(212,168,83,0.14), rgba(16,26,42,0) 70%)',
          }}
        >
          <div className="text-[26px] mb-1" aria-hidden="true">
            ☾
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4A853] font-bold">
            Bismillah
          </div>
          <h2 className="text-[21px] font-extrabold text-[#F5E8C7] leading-tight mt-1">
            Welcome to your Ethical Investment Mentor
          </h2>
          <p className="text-[12.5px] text-[#9A927E] leading-relaxed mt-2 max-w-xs mx-auto">
            Learn to invest the halal way — bounded by Shariah ethics, at a calm and
            considered pace. <span className="text-[#C9C0AB] font-semibold">No real money, ever.</span>
          </p>
        </div>

        {/* Three pillars */}
        <div className="px-5 pb-1 space-y-2.5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex items-start gap-3 rounded-xl border border-[rgba(212,168,83,0.14)] bg-[rgba(212,168,83,0.04)] p-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[rgba(212,168,83,0.25)]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(212,168,83,0.18), rgba(42,157,111,0.08))',
                  }}
                >
                  <Icon size={18} weight="duotone" className="text-[#D4A853]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[#F5E8C7]">{p.title}</div>
                  <div className="text-[11.5px] text-[#7A7363] leading-snug mt-0.5">{p.body}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ethos line */}
        <div className="px-6 pt-3 pb-1">
          <p className="text-[11px] text-[#5C5749] leading-relaxed text-center italic">
            No leaderboards. No daily profit-and-loss chase. Just understanding, practised
            patiently and weighed with a clear conscience.
          </p>
        </div>

        {/* CTA */}
        <div className="px-5 py-5">
          <button
            type="button"
            onClick={close}
            className="w-full h-12 rounded-xl text-[14px] font-bold text-[#0A0E16] transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)' }}
          >
            Bismillah, let’s begin
          </button>
        </div>
      </div>
    </div>
  );
}

export default EimWelcome;
