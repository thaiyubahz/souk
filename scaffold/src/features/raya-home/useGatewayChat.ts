/**
 * useGatewayChat — Raya's floating navigator chat.
 *
 * The popup is primarily a NAVIGATOR:
 *   • clear destination  → go straight there (narrated hand-off + gold warp)
 *   • ambiguous          → ask, and offer the candidate pages as tappable links
 *   • a real question    → answer it inline (LLM stream)
 *
 * Self-contained thread state — never touches the main chatbot store.
 */

import { useCallback, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { streamMessage, type StreamEvent } from '@/features/chatbot/services/chatbotService';
import type { NavigateLink } from '@/features/chatbot/types/chatbot.types';
import { useAuthStore } from '@/core/stores/auth.store';
import { resolveIntent } from '@/features/raya-agent/matching/intentMatcher';
import type { GatewayFeature } from './data/gatewayFeatures';
import { takingYouLine } from './data/gatewayLines';
import { playWarp } from './warpTransition';

/** The Nūr Ripple is always gold — Raya's light, regardless of destination. */
const WARP_GOLD = '#D4A853';
const TYPING_MS = 800; // Raya "thinks" before her line appears
const READ_MS = 850; // her line stays before the warp begins

/** Informational questions get answered, never auto-navigated. */
const INFO_RE = /(^|\b)(what'?s?|why|how|explain|define|meaning|difference|should i|can i|could i|is it|is this|are there|do you|tell me)(\b|$)/i;
const isInfoQuestion = (t: string) => INFO_RE.test(t);

export interface RouteSuggestion {
  label: string;
  route: string;
}

export interface GatewayMessage {
  id: string;
  role: 'user' | 'raya';
  text: string;
  navigateLinks?: NavigateLink[];
  /** Ambiguous-intent page choices, rendered as tappable links. */
  suggestions?: RouteSuggestion[];
  /** The original question — present on answers so we can offer "open Raya for the full answer". */
  rayaHandoff?: string;
  streaming?: boolean;
}

const GREETING =
  "Assalamu alaikum — I'm Raya, your navigator. Tell me where you want to go " +
  '(“my wallet”, “zakat”, “the souk”, “open the Qur’an”…) and I’ll take you straight there. ' +
  'Not sure? I’ll suggest. Ask me a question and I’ll answer.';

let counter = 0;
const nextId = () => `g${Date.now().toString(36)}-${counter++}`;

export function useGatewayChat(navigate: NavigateFunction) {
  const [messages, setMessages] = useState<GatewayMessage[]>([
    { id: nextId(), role: 'raya', text: GREETING },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  // Prefix "session-" so the backend treats this as a self-persisted web session
  // and does NOT create a duplicate "phantom" conversation in the user's history.
  const sessionIdRef = useRef<string>(`session-gw-${nextId()}`);

  const append = useCallback((m: GatewayMessage) => {
    setMessages((prev) => [...prev, m]);
    return m.id;
  }, []);

  const patchById = useCallback(
    (id: string, fn: (m: GatewayMessage) => GatewayMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m))),
    [],
  );

  /** Watchable hand-off: Raya thinks → says her line → gold warp → real page. */
  const narrateNav = useCallback(
    (route: string, line: string) => {
      const rayaId = nextId();
      append({ id: rayaId, role: 'raya', text: '', streaming: true });
      setIsStreaming(true);
      window.setTimeout(() => {
        patchById(rayaId, (m) => ({ ...m, streaming: false, text: line }));
      }, TYPING_MS);
      window.setTimeout(() => {
        playWarp({
          accent: WARP_GOLD,
          onCover: () => {
            setIsStreaming(false);
            navigate(route);
          },
        });
      }, TYPING_MS + READ_MS);
    },
    [append, patchById, navigate],
  );

  /** Stream a real LLM reply (for questions / conversation). */
  const streamReply = useCallback(
    async (text: string) => {
      const authUser = useAuthStore.getState().user;
      const rayaId = nextId();
      append({ id: rayaId, role: 'raya', text: '', streaming: true });
      setIsStreaming(true);
      try {
        await streamMessage(
          {
            user_id: authUser?.id ?? 'anonymous',
            session_id: sessionIdRef.current,
            // This is the quick navigator popup — keep answers short & direct.
            // The user's bubble shows their original text; only the request carries the hint.
            message: `${text}\n\n[Answer in 1–2 short sentences — direct, no preamble. This is a quick popup.]`,
            user_name: authUser?.displayName ?? undefined,
            context: { surface: 'navigator', concise: true },
          },
          (chunk) => patchById(rayaId, (m) => ({ ...m, text: m.text + chunk })),
          (done: StreamEvent) =>
            patchById(rayaId, (m) => ({
              ...m,
              streaming: false,
              navigateLinks: done.navigate_links ?? m.navigateLinks,
              // Brief popup answer → offer the full, detailed version in Raya.
              rayaHandoff: text,
            })),
        );
      } catch (err) {
        patchById(rayaId, (m) => ({
          ...m,
          streaming: false,
          text: m.text || "I couldn't reach the server just now. Try again, or open anything from the menu.",
        }));
        if (import.meta.env.DEV) console.error('[gateway chat] stream failed', err);
      } finally {
        setIsStreaming(false);
      }
    },
    [append, patchById],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = (raw ?? '').trim();
      if (!text || isStreaming) return;
      append({ id: nextId(), role: 'user', text });

      // 1) A real question → answer it (don't navigate).
      if (isInfoQuestion(text)) {
        void streamReply(text);
        return;
      }

      // 2) Deterministic page resolution.
      const { winner, candidates } = resolveIntent(text);
      if (winner) {
        // Clear → go straight there.
        narrateNav(winner.entry.route, takingYouLine(winner.entry.route, winner.entry.label));
        return;
      }
      if (candidates.length) {
        // Ambiguous → ask, offer the candidate pages as links.
        append({
          id: nextId(),
          role: 'raya',
          text: 'I want to take you to the right place — did you mean one of these?',
          suggestions: candidates.slice(0, 4).map((c) => ({ label: c.entry.label, route: c.entry.route })),
        });
        return;
      }

      // 3) Nothing matched → conversational reply.
      void streamReply(text);
    },
    [append, narrateNav, streamReply, isStreaming],
  );

  /** Navigate to a chosen route (suggestion tap), with the narrated hand-off. */
  const openRoute = useCallback(
    (route: string, label?: string) => {
      if (isStreaming) return;
      narrateNav(route, takingYouLine(route, label));
    },
    [narrateNav, isStreaming],
  );

  /** Hand a detailed topic off to the full Raya assistant, carrying the question. */
  const openRaya = useCallback(
    (question?: string) => {
      navigate('/ai-assistant', { state: { initialMessage: question, newChat: Date.now() } });
    },
    [navigate],
  );

  /** Open a known feature (chip / menu pick) — skips the matcher. */
  const openFeature = useCallback(
    (feature: GatewayFeature) => {
      if (isStreaming) return;
      append({ id: nextId(), role: 'user', text: feature.chip ?? feature.name });
      narrateNav(feature.route, takingYouLine(feature.route, feature.name));
    },
    [append, narrateNav, isStreaming],
  );

  return { messages, isStreaming, send, openFeature, openRoute, openRaya };
}
