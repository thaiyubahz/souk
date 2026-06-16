/**
 * Hifz Circles list page — create new circle or join via invite code,
 * shows all circles the user belongs to.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Plus, SignIn, ArrowRight, Spinner } from '@phosphor-icons/react';
import { listMyCircles, createCircle, joinCircle, type HifzCircle } from '../services/hifzCirclesService';
import { trackFeature } from '@/lib/analytics';
import { IslamicGeometryBackground } from '@/components/shared/IslamicGeometryBackground';
import { CircleInvitesBanner } from '../components/CircleInvitesBanner';

export function QuranHifzCirclesPage() {
  useEffect(() => { trackFeature('quran_hifz_circles'); }, []);
  const navigate = useNavigate();
  const [circles, setCircles] = useState<HifzCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setCircles(await listMyCircles());
    } catch (err) {
      console.warn('listMyCircles failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const c = await createCircle(name, desc);
      setMode('idle');
      setName('');
      setDesc('');
      navigate(`/quran/hifz/circles/${c.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      const c = await joinCircle(code);
      setMode('idle');
      setCode('');
      navigate(`/quran/hifz/circles/${c.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-60px)] bg-transparent pb-24 relative overflow-hidden">
      <IslamicGeometryBackground opacity={0.04} color="#D4A853" />
      <CircleInvitesBanner />
      <div className="sticky top-0 z-10 bg-[#0A0E16]/95 backdrop-blur-md border-b border-[#F5E8C7]/10">
        <div className="px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08] flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-[#C9C0A8]" />
          </button>
          <div className="flex items-center gap-2">
            <Users size={16} weight="fill" className="text-[#D4A853]" />
            <h1 className="text-sm font-semibold text-[#F5E8C7]">Hifz Circles</h1>
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 pt-5">
        <p className="text-xs text-[#C9C0A8] mb-4 leading-relaxed">
          Memorize together. Create a circle for your family, masjid, or class — every member checks in
          daily with how many ayahs they revised. Streaks, totals, and a shared journal keep everyone moving.
        </p>

        {/* Action buttons */}
        {mode === 'idle' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('create')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D4A853]/15 border border-[#D4A853]/30 text-[#D4A853] text-sm font-semibold hover:bg-[#D4A853]/25 transition-colors"
            >
              <Plus size={16} weight="bold" /> Create Circle
            </button>
            <button
              onClick={() => setMode('join')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 text-[#F5E8C7] text-sm font-semibold hover:bg-[#F5E8C7]/[0.08] transition-colors"
            >
              <SignIn size={16} weight="bold" /> Join with Code
            </button>
          </div>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 p-4 mb-4"
          >
            <p className="text-[11px] uppercase tracking-wide text-[#8A8270] font-semibold mb-3">Create a circle</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Circle name (e.g. Ahmad family)"
              className="w-full bg-[#0A0E16]/60 border border-[#F5E8C7]/10 rounded-lg p-3 text-sm text-[#F5E8C7] placeholder:text-[#4A4639] focus:outline-none focus:border-[#D4A853]/40 mb-2"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- user-action-triggered "Create circle" sheet; auto-focus is expected UX
              autoFocus
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, 200))}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-[#0A0E16]/60 border border-[#F5E8C7]/10 rounded-lg p-3 text-sm text-[#F5E8C7] placeholder:text-[#4A4639] resize-none focus:outline-none focus:border-[#D4A853]/40"
            />
            {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setMode('idle'); setError(null); }}
                className="flex-1 py-2 rounded-lg bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 text-[#C9C0A8] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={busy || name.trim().length < 3}
                onClick={handleCreate}
                className="flex-1 py-2 rounded-lg bg-[#D4A853] text-[#0A0E16] text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Spinner size={12} className="animate-spin" />} Create
              </button>
            </div>
          </motion.div>
        )}

        {/* Join form */}
        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 p-4 mb-4"
          >
            <p className="text-[11px] uppercase tracking-wide text-[#8A8270] font-semibold mb-3">Join with invite code</p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="6-char code (e.g. K7XQ2N)"
              className="w-full bg-[#0A0E16]/60 border border-[#F5E8C7]/10 rounded-lg p-3 text-base font-mono tracking-widest text-center text-[#F5E8C7] placeholder:text-[#4A4639] focus:outline-none focus:border-[#D4A853]/40"
              maxLength={6}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- user-action-triggered "Join circle" sheet; auto-focus is expected UX
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setMode('idle'); setError(null); }}
                className="flex-1 py-2 rounded-lg bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 text-[#C9C0A8] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={busy || code.length !== 6}
                onClick={handleJoin}
                className="flex-1 py-2 rounded-lg bg-[#D4A853] text-[#0A0E16] text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Spinner size={12} className="animate-spin" />} Join
              </button>
            </div>
          </motion.div>
        )}

        {/* My circles */}
        <p className="text-[11px] uppercase tracking-wide text-[#8A8270] font-semibold mb-2 mt-6">My Circles</p>
        {loading ? (
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-[#F5E8C7]/[0.04] animate-pulse" />
            <div className="h-16 rounded-xl bg-[#F5E8C7]/[0.04] animate-pulse" />
          </div>
        ) : circles.length === 0 ? (
          <div className="rounded-xl bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 border-dashed p-6 text-center">
            <Users size={28} weight="duotone" className="text-[#4A4639] mx-auto mb-2" />
            <p className="text-sm text-[#C9C0A8] font-medium">You're not in any circles yet</p>
            <p className="text-xs text-[#8A8270] mt-1">Create one or ask a friend for an invite code</p>
          </div>
        ) : (
          <div className="space-y-2">
            {circles.map((c) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/quran/hifz/circles/${c.id}`)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#D4A853]/10 to-[#0C0F15]/10 border border-[#D4A853]/20 text-left hover:border-[#D4A853]/40 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#D4A853]/15 flex items-center justify-center shrink-0">
                  <Users size={18} weight="fill" className="text-[#D4A853]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F5E8C7] truncate">{c.name}</p>
                  <p className="text-[11px] text-[#8A8270]">
                    {c.memberCount} member{c.memberCount !== 1 ? 's' : ''} · code {c.id}
                  </p>
                </div>
                <ArrowRight size={16} className="text-[#D4A853]/60 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuranHifzCirclesPage;
