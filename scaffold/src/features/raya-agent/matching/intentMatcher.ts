/**
 * intentMatcher.ts — deterministic, explainable page resolution.
 *
 * No LLM, no network. Scores every catalog entry against the user's phrase
 * using a fixed ladder (strongest signal first) and returns a confident winner
 * only when it clears an absolute floor AND beats the runner-up by a margin.
 */

import { PAGE_CATALOG, type PageEntry } from '../catalog/pageCatalog';
import { clean, canonicalTokens, tokenize, fuzzyTokenEq } from './normalize';

/** Weights for each rung of the scoring ladder (strongest → weakest). */
const W = {
  aliasExact: 6, // the whole phrase IS a known alias
  aliasPhrase: 4, // a known alias appears inside the phrase
  keyword: 1.4, // per overlapping keyword token
  label: 1, // per overlapping label token
  fuzzy: 1, // per single-typo token match (only when no exact keyword hit)
} as const;

/** A confident winner needs a normalized score at/above this. */
export const CONFIDENCE_MIN = 0.26;
/** ...and must beat the runner-up by at least this normalized gap. */
export const MARGIN = 0.1;

export interface ScoreBreakdown {
  aliasExact: number;
  aliasPhrase: number;
  keyword: number;
  label: number;
  fuzzy: number;
}

export interface Candidate {
  entry: PageEntry;
  /** Saturating-normalized score in [0,1). */
  score: number;
  /** Raw (pre-normalization) score. */
  raw: number;
  breakdown: ScoreBreakdown;
}

export interface IntentResult {
  winner: Candidate | null;
  candidates: Candidate[];
  /** Why there's no winner (for debugging / future UI). */
  reason?: 'empty' | 'below-floor' | 'ambiguous';
}

/** raw → [0,1) saturating curve. raw=2.5 ≈ 0.5; grows but never reaches 1. */
function normalizeScore(raw: number): number {
  return raw / (raw + 2.5);
}

function scoreEntry(entry: PageEntry, phrase: string, tokenSet: Set<string>, rawTokens: string[]): Candidate {
  const breakdown: ScoreBreakdown = { aliasExact: 0, aliasPhrase: 0, keyword: 0, label: 0, fuzzy: 0 };

  // 1) Alias phrase matches (strongest).
  for (const alias of entry.aliases) {
    const a = clean(alias);
    if (!a) continue;
    if (phrase === a) {
      breakdown.aliasExact = Math.max(breakdown.aliasExact, W.aliasExact);
    } else if (phrase.includes(a) && a.includes(' ')) {
      // Only count multi-word aliases for substring matches — single words are
      // already covered by keyword overlap and would double-count.
      breakdown.aliasPhrase = Math.max(breakdown.aliasPhrase, W.aliasPhrase);
    }
  }

  // 2) Keyword token overlap.
  for (const kw of entry.keywords) {
    if (tokenSet.has(kw)) breakdown.keyword += W.keyword;
  }

  // 3) Label token overlap.
  for (const lt of tokenize(entry.label)) {
    if (tokenSet.has(lt)) breakdown.label += W.label;
  }

  // 4) Fuzzy single-typo token match against keywords (only when no exact
  //    keyword already hit, so a typo doesn't stack on top of a real match).
  if (breakdown.keyword === 0) {
    let fuzzyHit = false;
    for (const kw of entry.keywords) {
      if (fuzzyHit) break;
      for (const rt of rawTokens) {
        if (fuzzyTokenEq(rt, kw)) {
          breakdown.fuzzy += W.fuzzy;
          fuzzyHit = true;
          break;
        }
      }
    }
  }

  const raw =
    breakdown.aliasExact +
    breakdown.aliasPhrase +
    breakdown.keyword +
    breakdown.label +
    breakdown.fuzzy;

  return { entry, raw, score: normalizeScore(raw), breakdown };
}

/**
 * Resolve a destination phrase (the part naming where to go — the nav verb
 * should already be stripped). Returns a confident winner or ranked candidates.
 */
export function resolveIntent(phrase: string): IntentResult {
  const cleaned = clean(phrase);
  if (!cleaned) return { winner: null, candidates: [], reason: 'empty' };

  // Expanded token set (synonyms) for keyword/label overlap; raw tokens for fuzzy.
  const tokenSet = new Set(canonicalTokens(phrase));
  const rawTokens = tokenize(phrase);

  const candidates = PAGE_CATALOG.map((e) => scoreEntry(e, cleaned, tokenSet, rawTokens))
    .filter((c) => c.raw > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return { winner: null, candidates: [], reason: 'below-floor' };
  }

  const top = candidates[0];
  const runnerUp = candidates[1];

  if (top.score < CONFIDENCE_MIN) {
    return { winner: null, candidates, reason: 'below-floor' };
  }
  if (runnerUp && top.score - runnerUp.score < MARGIN) {
    return { winner: null, candidates, reason: 'ambiguous' };
  }

  return { winner: top, candidates };
}

/** Top-N ranked candidates regardless of confidence (for "did you mean" UI). */
export function suggestPages(phrase: string, n = 5): Candidate[] {
  const cleaned = clean(phrase);
  if (!cleaned) return [];
  const tokenSet = new Set(canonicalTokens(phrase));
  const rawTokens = tokenize(phrase);
  return PAGE_CATALOG.map((e) => scoreEntry(e, cleaned, tokenSet, rawTokens))
    .filter((c) => c.raw > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
