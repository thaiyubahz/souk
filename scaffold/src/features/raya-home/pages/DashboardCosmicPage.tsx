/**
 * DashboardCosmicPage — the home dashboard, redesigned in the gateway's
 * "Raya universe" aesthetic. The anchor for the per-page redesign: it sets the
 * language (cosmic shell, glass gold-rule cards, serif headings, warp nav) that
 * the other feature pages will follow.
 *
 * Surfaces: greeting + Hijri date, Talk-to-Raya CTA, a "your journey" snapshot
 * (DinarZ balance, Qur'an streak, gratitude streak, EIM learning streak), prayer
 * times, the day's ayah (the same rotation as the Qur'an Daily Ayah page), and a
 * few "keep exploring" cards for live features not already surfaced here. Every
 * data widget degrades gracefully — a failed/empty source shows a gentle nudge,
 * never a broken card.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Sparkle, Wallet, BookOpen, HandHeart,
  ChartLineUp, Scales, RocketLaunch,
} from '@phosphor-icons/react';
import { useAuthStore } from '@/core/stores/auth.store';
import { getPrayerTimes } from '@/features/home/services/prayerTimeService';
import { subscribeDNZBalance } from '@/features/wallet/services/walletService';
import { getStats as getBarkaStats } from '@/features/barka-labs/services/barkaLabsService';
import { getStreakInfo } from '@/features/quran/services/quranStreakService';
import { getTodaysAyah } from '@/features/quran/services/dailyAyahService';
import { fetchVerse } from '@/features/quran/services/quranApiService';
import { eimService } from '@/features/eim/services/eim.service';
import { CosmicPage } from '../cosmic/CosmicPage';
import { CosmicCard, CosmicKicker, CosmicSectionTitle, GoldButton, GhostButton, StatRow } from '../cosmic/cosmicUI';
import { playWarp } from '../warpTransition';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'good morning';
  if (h < 17) return 'good afternoon';
  return 'good evening';
}

/** Compact metric tile for the "your journey" snapshot row. */
function JourneyStat({
  icon, value, label, sub, accent, onClick,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  sub: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <CosmicCard onClick={onClick} className="flex items-center gap-3.5">
      <span
        className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: `${accent}1f`, color: accent, boxShadow: 'inset 0 0 0 1px rgba(245,232,199,0.05)' }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[24px] leading-none text-[#F5E8C7]">{value}</div>
        <div className="text-[12.5px] text-[#C9C0A8] mt-1.5 leading-tight">{label}</div>
        <div className="text-[11px] text-[#8A8270] mt-0.5 leading-tight truncate">{sub}</div>
      </div>
      <ArrowRight size={15} className="text-[#4A4639] shrink-0" />
    </CosmicCard>
  );
}

/** Descriptive entry card for the "keep exploring" section. */
function FeatureCard({
  icon, title, ar, desc, accent, soon, onClick,
}: {
  icon: ReactNode;
  title: string;
  ar: string;
  desc: string;
  accent: string;
  soon?: boolean;
  onClick: () => void;
}) {
  return (
    <CosmicCard onClick={onClick} className="flex items-start gap-3.5">
      <span
        className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: `${accent}1f`, color: accent, boxShadow: 'inset 0 0 0 1px rgba(245,232,199,0.05)' }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[19px] text-[#F5E8C7] flex items-baseline gap-2 leading-tight">
          {title}
          <span className="font-arabic text-[13px]" style={{ color: accent }}>{ar}</span>
          {soon && (
            <span className="text-[9px] tracking-[1px] uppercase text-[#4A4639] border border-[#F5E8C7]/10 px-1.5 py-[2px] rounded-full">
              Soon
            </span>
          )}
        </div>
        <div className="text-[12.5px] text-[#8A8270] mt-1 font-light">{desc}</div>
      </div>
      <ArrowRight size={15} className="text-[#4A4639] mt-1.5 shrink-0" />
    </CosmicCard>
  );
}

export function DashboardCosmicPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const userName = user?.displayName;

  const [hijri, setHijri] = useState('');
  const [prayer, setPrayer] = useState<{ next: string; until: string } | null>(null);
  const [times, setTimes] = useState<Record<string, string>>({});

  // "Your journey" snapshot. DNZ streams from Firestore (resilient); the Qur'an
  // streak is local; gratitude + EIM are backend calls wrapped so a hiccup can't
  // break the dashboard. `null` = still loading / unavailable → cards show a nudge.
  const [dnz, setDnz] = useState<{ total: number; lifetime: number } | null>(null);
  const [quran] = useState(() => {
    try {
      return getStreakInfo();
    } catch {
      return null;
    }
  });
  const [gratitude, setGratitude] = useState<{ streak: number; total: number } | null>(null);
  const [eim, setEim] = useState<{ streak: number; longest: number } | null>(null);

  // Day's ayah — same rotation as the Qur'an Daily Ayah page (getTodaysAyah),
  // with the verse text fetched on the fly.
  const [ayahPick] = useState(() => {
    try {
      return getTodaysAyah();
    } catch {
      return null;
    }
  });
  const [ayah, setAyah] = useState<{ arabic: string; translation: string } | null>(null);

  useEffect(() => {
    getPrayerTimes()
      .then((d) => {
        if (d.hijriDate) setHijri(d.hijriDate);
        setPrayer({ next: d.nextPrayer, until: d.timeUntilNext });
        setTimes(d.times ?? {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ayahPick) return;
    let cancelled = false;
    fetchVerse(ayahPick.surahId, ayahPick.ayahNumber)
      .then((v) => {
        if (!cancelled && v) setAyah({ arabic: v.arabic, translation: v.translation });
      })
      .catch(() => {/* leave skeleton; the daily-ayah page still works */});
    return () => { cancelled = true; };
  }, [ayahPick]);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeDNZBalance(userId, (b) =>
      setDnz({ total: b.total ?? 0, lifetime: b.lifetime_earned ?? 0 }),
    );
    let cancelled = false;
    getBarkaStats(userId)
      .then((s) => { if (!cancelled) setGratitude({ streak: s.current_streak ?? 0, total: s.total_blessings ?? 0 }); })
      .catch(() => {/* backend unavailable — leave as a gentle nudge */});
    eimService.getStreak(userId)
      .then((s) => { if (!cancelled) setEim({ streak: s.current_streak ?? 0, longest: s.longest_streak ?? 0 }); })
      .catch(() => {/* backend unavailable — leave as a gentle nudge */});
    return () => {
      cancelled = true;
      unsub();
    };
  }, [userId]);

  const go = (route: string) =>
    playWarp({
      origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      accent: '#D4A853',
      onCover: () => navigate(route),
    });

  const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  return (
    <CosmicPage maxWidth={1040}>
      {/* Greeting hero */}
      <div className="text-center pt-2 pb-8">
        <p className="text-[#E8C97A] text-[14px] mb-3">
          Assalamu alaikum{userName ? `, ${userName}` : ''} — {greeting()}
        </p>
        <h1 className="font-display font-normal leading-[1.06] text-[#F5E8C7]" style={{ fontSize: 'clamp(30px,4.6vw,46px)' }}>
          Your Islamic super-agent <br className="hidden sm:block" />
          <em className="not-italic italic text-[#E8C97A]">is ready.</em>
        </h1>
        <div className="mt-5 inline-flex items-center gap-3 flex-wrap justify-center">
          <span className="px-5 py-2 rounded-full border border-[#D4A853]/30 bg-[#D4A853]/10 font-arabic text-[17px] text-[#E8C97A]">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </span>
          {hijri && (
            <span className="text-[12px] text-[#8A8270] bg-[#F5E8C7]/[0.04] px-3 py-[7px] rounded-full border border-[#F5E8C7]/10">
              {hijri}
            </span>
          )}
        </div>
      </div>

      {/* Ask-Raya CTA */}
      <CosmicCard accent="#D4A853" className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[11px] flex items-center justify-center bg-gradient-to-br from-[#E8C97A] to-[#D4A853] text-[#1a1206]">
            <Sparkle size={18} weight="fill" />
          </span>
          <div>
            <div className="font-display text-[19px] text-[#F5E8C7] leading-tight">Talk to Raya</div>
            <div className="text-[12.5px] text-[#8A8270]">Ask anything, or tell her where to take you.</div>
          </div>
        </div>
        <GoldButton onClick={() => navigate('/ai-assistant', { state: { newChat: Date.now() } })}>
          Open chat <ArrowRight size={15} weight="bold" />
        </GoldButton>
      </CosmicCard>

      {/* Your journey — live snapshot across DinarZ, Qur'an, gratitude and EIM */}
      <div className="mb-5">
        <CosmicKicker>Your journey</CosmicKicker>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <JourneyStat
            accent="#D4A853"
            icon={<Wallet size={20} weight="fill" />}
            value={dnz ? dnz.total.toLocaleString() : '—'}
            label="DinarZ balance"
            sub={dnz ? `${dnz.lifetime.toLocaleString()} earned all-time` : 'Open your wallet'}
            onClick={() => go('/wallet')}
          />
          <JourneyStat
            accent="#3E9E8E"
            icon={<BookOpen size={20} weight="fill" />}
            value={quran ? `${quran.streakCount}🔥` : '—'}
            label="Qur’an reading streak"
            sub={
              quran
                ? quran.streakEarnedToday
                  ? 'Today’s reading done — mashaʾAllah'
                  : `${quran.dailyReadCount}/${quran.dailyTarget} ayahs today`
                : 'Start reading today'
            }
            onClick={() => go('/quran')}
          />
          <JourneyStat
            accent="#2A9D6F"
            icon={<HandHeart size={20} weight="fill" />}
            value={gratitude ? `${gratitude.streak}🔥` : '—'}
            label="Gratitude streak"
            sub={gratitude ? `${gratitude.total.toLocaleString()} blessings noticed` : 'Notice a blessing'}
            onClick={() => go('/barakah-labs')}
          />
          <JourneyStat
            accent="#8AB4D8"
            icon={<ChartLineUp size={20} weight="fill" />}
            value={eim ? `${eim.streak}🔥` : '—'}
            label="EIM learning streak"
            sub={eim ? (eim.longest > eim.streak ? `${eim.longest} day best` : 'Keep it going') : 'Start a lesson'}
            onClick={() => go('/eim')}
          />
        </div>
      </div>

      {/* Prayer times + daily ayah */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CosmicCard>
          <div className="flex items-center justify-between mb-2">
            <CosmicKicker>Prayer times</CosmicKicker>
            {prayer && (
              <span className="text-[12px] text-[#E8C97A]">
                {prayer.next} in {prayer.until}
              </span>
            )}
          </div>
          {prayerOrder.map((p) => (
            <StatRow key={p} label={p} value={times[p] ?? '—'} warn={prayer?.next === p} />
          ))}
          <GhostButton full className="mt-4" onClick={() => go('/prayer-times')}>
            Open prayer times
          </GhostButton>
        </CosmicCard>

        <CosmicCard className="text-center flex flex-col">
          <CosmicKicker>Ayah of the day</CosmicKicker>
          {ayah ? (
            <>
              <div className="font-arabic text-[26px] leading-[1.9] text-[#F5E8C7] my-2" dir="rtl">
                {ayah.arabic}
              </div>
              {ayah.translation && (
                <div className="font-display text-[18px] text-[#E8C97A] leading-snug">
                  “{ayah.translation}”
                </div>
              )}
            </>
          ) : (
            <div className="my-6 space-y-3" aria-busy="true">
              <div className="h-7 rounded bg-[#F5E8C7]/[0.05] animate-pulse" />
              <div className="h-5 w-3/4 mx-auto rounded bg-[#F5E8C7]/[0.05] animate-pulse" />
            </div>
          )}
          {ayahPick && (
            <div className="text-[11px] tracking-[1px] uppercase text-[#8A8270] mt-3">
              Qur’an · {ayahPick.verseKey}
            </div>
          )}
          <div className="mt-auto pt-5 flex gap-2.5 justify-center">
            <GoldButton onClick={() => go('/quran/daily-ayah')}>Open today’s ayah</GoldButton>
            <GhostButton
              onClick={() =>
                navigate('/ai-assistant', {
                  state: {
                    initialMessage: `Reflect with me on Qur'an ${ayahPick?.verseKey ?? ''}`.trim(),
                    newChat: Date.now(),
                  },
                })
              }
            >
              Reflect with Raya
            </GhostButton>
          </div>
        </CosmicCard>
      </div>

      {/* Keep exploring — live features not already surfaced above */}
      <div className="mt-7">
        <CosmicSectionTitle ar="واصل">Keep exploring</CosmicSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureCard
            accent="#D4A853"
            icon={<Scales size={20} weight="fill" />}
            title="Zakat"
            ar="زكاة"
            desc="Calculate what’s due, to the AAOIFI standard."
            onClick={() => go('/zakat')}
          />
          <FeatureCard
            accent="#527E9E"
            icon={<RocketLaunch size={20} weight="fill" />}
            title="Looop"
            ar="لوب"
            desc="Ventures and builders — the community’s launchpad."
            soon
            onClick={() => go('/shark-tank')}
          />
        </div>
      </div>
    </CosmicPage>
  );
}
