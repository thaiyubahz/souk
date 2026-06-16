/**
 * useRayaSend — deterministic nav-or-chat decision for the Raya chat input.
 *
 * Two tiers, evaluated in order:
 *   1. QUESTION GUARD (the whole point): if the text reads like a question,
 *      never navigate — hand it to the LLM so it gets ANSWERED.
 *      "what is zakat" → chat.   "open zakat calculator" → nav.
 *   2. NAV TIER: the text must start with a nav verb ("take me to", "open",
 *      "show me", …) AND resolve to a confident page → navigate, return 'nav'.
 *   Anything else → 'chat'.
 *
 * `decideRoute` is the pure, framework-free core (used by tests). The hook just
 * wires it to react-router's navigate().
 */

import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { hasQuestionCue, stripNavVerb } from './matching/normalize';
import { resolveIntent } from './matching/intentMatcher';

export type SendDecision = 'nav' | 'chat';

export interface RouteDecision {
  decision: SendDecision;
  /** Present only when decision === 'nav'. */
  route?: string;
  label?: string;
}

/**
 * Pure decision: should this text navigate, and where? No side effects.
 */
export function decideRoute(text: string): RouteDecision {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return { decision: 'chat' };

  // Tier 1 — question guard. Questions are always answered, never routed.
  if (hasQuestionCue(trimmed)) return { decision: 'chat' };

  // Tier 2 — explicit nav command. Requires a leading nav verb.
  const destination = stripNavVerb(trimmed);
  if (destination === null) return { decision: 'chat' }; // no nav verb → chat
  if (destination === '') return { decision: 'chat' };    // bare verb, no target

  const { winner } = resolveIntent(destination);
  if (winner) {
    return { decision: 'nav', route: winner.entry.route, label: winner.entry.label };
  }
  return { decision: 'chat' };
}

/**
 * Hook returning a send handler. Call it with the user's text:
 *   - returns 'nav'  → it already called navigate(); caller should stop.
 *   - returns 'chat' → caller should hand off to the LLM (sendUserMessage).
 */
export function useRayaSend(navigate: NavigateFunction): (text: string) => SendDecision {
  return useCallback(
    (text: string): SendDecision => {
      const result = decideRoute(text);
      if (result.decision === 'nav' && result.route) {
        navigate(result.route);
        return 'nav';
      }
      return 'chat';
    },
    [navigate],
  );
}
