import { describe, it, expect, vi } from 'vitest';
import {
  clean,
  tokenize,
  levenshtein,
  fuzzyTokenEq,
  expandSynonyms,
  canonicalTokens,
  hasQuestionCue,
  stripNavVerb,
} from '../matching/normalize';
import { resolveIntent, suggestPages } from '../matching/intentMatcher';
import { decideRoute, useRayaSend } from '../useRayaSend';
import { renderHook } from '@testing-library/react';

// ── normalize units ────────────────────────────────────────────
describe('normalize', () => {
  it('cleans punctuation, diacritics and apostrophes', () => {
    expect(clean("Qur'an!!")).toBe('quran');
    expect(clean('  Prayer   Times  ')).toBe('prayer times');
    expect(clean('Zakāt')).toBe('zakat');
  });

  it('strips filler/command words', () => {
    expect(tokenize('take me to my wallet')).toEqual(['wallet']);
    expect(tokenize('please open the prayer times')).toEqual(['prayer', 'times']);
    expect(tokenize('i want to see my profile')).toEqual(['profile']);
  });

  it('computes levenshtein distance', () => {
    expect(levenshtein('wallet', 'wallet')).toBe(0);
    expect(levenshtein('walet', 'wallet')).toBe(1);
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('fuzzy-matches single typos only on long words', () => {
    expect(fuzzyTokenEq('walet', 'wallet')).toBe(true);   // 1 edit, long enough
    expect(fuzzyTokenEq('prayrtimes', 'prayertimes')).toBe(true);
    expect(fuzzyTokenEq('hifz', 'hajj')).toBe(false);     // short words must be exact
    expect(fuzzyTokenEq('zkat', 'zakat')).toBe(false);    // length 4, too short to fuzz
    expect(fuzzyTokenEq('souk', 'sock')).toBe(false);
  });

  it('expands synonyms', () => {
    expect(expandSynonyms(['marketplace'])).toContain('souk');
    expect(expandSynonyms(['marriage'])).toContain('matrimony');
    expect(canonicalTokens('my wealth')).toContain('eim');
  });

  it('detects question cues', () => {
    expect(hasQuestionCue('what is zakat')).toBe(true);
    expect(hasQuestionCue('how do i calculate zakat')).toBe(true);
    expect(hasQuestionCue('is this stock halal')).toBe(true);
    expect(hasQuestionCue('open zakat calculator')).toBe(false);
    expect(hasQuestionCue('take me to my wallet')).toBe(false);
    expect(hasQuestionCue('anything?')).toBe(true);
  });

  it('strips leading nav verbs (longest first)', () => {
    expect(stripNavVerb('take me to my wallet')).toBe('my wallet');
    expect(stripNavVerb('open prayer times')).toBe('prayer times');
    expect(stripNavVerb('go to souk')).toBe('souk');
    expect(stripNavVerb('marketplace')).toBeNull();   // no nav verb
    expect(stripNavVerb('open')).toBe('');            // bare verb
  });
});

// ── resolveIntent table ────────────────────────────────────────
describe('resolveIntent', () => {
  const cases: Array<[string, string]> = [
    ['take me to my wallet', '/wallet'],
    ['open prayer times', '/prayer-times'],
    ['quran reading', '/quran/read'],
    ['is this stock halal', '/screener'],
    ['marketplace', '/souk'],
    ['walet', '/wallet'],               // single-char typo
    ['zakat calculator', '/zakat'],
    ['qibla compass', '/qibla'],
    ['find a spouse', '/matrimony'],
  ];

  it.each(cases)('resolves %j → %s', (input, route) => {
    const { winner } = resolveIntent(input);
    expect(winner).not.toBeNull();
    expect(winner!.entry.route).toBe(route);
  });

  it('returns no confident winner for gibberish', () => {
    const { winner } = resolveIntent('asdfqwerzxcv blargh');
    expect(winner).toBeNull();
  });

  it('returns no winner for empty input', () => {
    expect(resolveIntent('   ').winner).toBeNull();
    expect(resolveIntent('   ').reason).toBe('empty');
  });

  it('suggestPages returns ranked candidates', () => {
    const s = suggestPages('quran');
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].entry.route.startsWith('/quran')).toBe(true);
  });
});

// ── decideRoute (pure send decision) ───────────────────────────
describe('decideRoute', () => {
  it('navigates on nav-verb + confident page', () => {
    expect(decideRoute('open zakat calculator')).toMatchObject({ decision: 'nav', route: '/zakat' });
    expect(decideRoute('take me to my wallet')).toMatchObject({ decision: 'nav', route: '/wallet' });
    expect(decideRoute('show me prayer times')).toMatchObject({ decision: 'nav', route: '/prayer-times' });
  });

  it('NEVER navigates on a question (the guard)', () => {
    expect(decideRoute('what is zakat').decision).toBe('chat');
    expect(decideRoute('how do i calculate my zakat').decision).toBe('chat');
    expect(decideRoute('is this stock halal').decision).toBe('chat');
  });

  it('chats when there is no nav verb', () => {
    expect(decideRoute('marketplace').decision).toBe('chat');
    expect(decideRoute('i feel anxious today').decision).toBe('chat');
  });

  it('chats on a bare verb with no destination', () => {
    expect(decideRoute('open').decision).toBe('chat');
  });

  it('chats when the destination is unrecognizable', () => {
    expect(decideRoute('open the flibbertigibbet').decision).toBe('chat');
  });
});

// ── useRayaSend hook ───────────────────────────────────────────
describe('useRayaSend', () => {
  it('calls navigate and returns nav for a nav command', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useRayaSend(navigate));
    expect(result.current('open prayer times')).toBe('nav');
    expect(navigate).toHaveBeenCalledWith('/prayer-times');
  });

  it('returns chat and does not navigate for a question', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useRayaSend(navigate));
    expect(result.current('what is zakat')).toBe('chat');
    expect(navigate).not.toHaveBeenCalled();
  });
});
