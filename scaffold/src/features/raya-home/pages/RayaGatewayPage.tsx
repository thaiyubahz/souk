/**
 * RayaGatewayPage — the immersive "talk to Raya, she takes you everywhere" home,
 * now a full chat surface in its own right.
 *
 * Two states on one page:
 *  - Calm hero (no messages yet): bismillah, Raya's invitation, quick chips, and
 *    the composer. Pure brand moment.
 *  - Chatting (first message sent): the hero collapses and a live, streaming Raya
 *    thread takes over — with the full AI-assistant chrome (companion selector,
 *    history + new chat, insights, language, feedback) sliding into the topbar.
 *
 * This page IS Raya, so it carries no floating orb/popup (that dock lives on every
 * *other* app page via MainLayout). The old /ai-assistant route now redirects here,
 * forwarding any { initialMessage, companionId, quranAnchor, newChat } nav state.
 *
 * Full-bleed, no MainLayout chrome. The left hamburger opens "Raya's Universe".
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  List,
  CaretDown,
  Brain,
  ClockCounterClockwise,
  PlusCircle,
  ChatTeardropDots,
  GlobeSimple,
  WifiSlash,
  Microphone,
  MicrophoneSlash,
  BookOpen,
  X,
} from '@phosphor-icons/react';
import { useAuthStore } from '@/core/stores/auth.store';
import { trackFeature } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { DisclaimerBanner, DisclaimerModal } from '@/components/shared';
import { useDisclaimerSeen } from '@/features/legal/hooks/useDisclaimerSeen';
import { useRayaSend } from '@/features/raya-agent/useRayaSend';
import { RayaStarCanvas } from '../components/RayaStarCanvas';
import { RayaUniverseRail } from '../components/RayaUniverseRail';
import { RayaHeroOrb } from '../components/RayaHeroOrb';
import { playWarp } from '../warpTransition';
import { HERO_CHIPS, type GatewayFeature } from '../data/gatewayFeatures';
import { useChatbotStore } from '@/features/chatbot/stores/chatbot.store';
import { checkHealth } from '@/features/chatbot/services/chatbotService';
import { ChatMessageBubble } from '@/features/chatbot/components/ChatMessageBubble';
import { CompanionSelector } from '@/features/chatbot/components/CompanionSelector';
import { ConversationHistory } from '@/features/chatbot/components/ConversationHistory';
import { InsightsPanel } from '@/features/chatbot/components/InsightsPanel';
import { ChatFeedbackPopup } from '@/features/chatbot/components/ChatFeedbackPopup';
import { ChatbotWalkthrough } from '@/features/chatbot/components/ChatbotWalkthrough';
import type { QuranAnchor } from '@/features/chatbot/types/chatbot.types';

const FEEDBACK_SHOWN_KEY = 'zaryah_chat_feedback_shown';

/** Suggested follow-up questions shown under the Quran anchor pill. */
const RAYA_ANCHOR_CHIPS = [
  'What does this ayah teach me?',
  'What is the context of revelation?',
  'How can I apply this today?',
] as const;

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect', flag: '🌐' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { code: 'so', label: 'Soomaali', flag: '🇸🇴' },
] as const;

/** Slow, graceful "page turn" easing shared across the hero→chat transition. */
const SLOW_EASE = [0.16, 1, 0.3, 1] as const;

/** Topbar action cluster: the buttons drop in from above and arrange one by one. */
const ACTIONS_CONTAINER = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.35, ease: SLOW_EASE } },
};
const ACTION_ITEM = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: SLOW_EASE } },
};

function useChatFeedbackTrigger(messages: { isUser: boolean }[]) {
  const userId = useAuthStore((s) => s.user?.id);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const key = `${FEEDBACK_SHOWN_KEY}_${userId ?? 'anon'}`;
    try {
      if (localStorage.getItem(key) === '1') return;
    } catch { return; }

    const userMsgCount = messages.filter((m) => m.isUser).length;
    if (userMsgCount >= 3) {
      setShowFeedback(true);
      try { localStorage.setItem(key, '1'); } catch { /* best-effort */ }
    }
  }, [messages, userId]);

  const openFeedback = useCallback(() => setShowFeedback(true), []);
  const closeFeedback = useCallback(() => setShowFeedback(false), []);

  return [showFeedback, closeFeedback, openFeedback] as const;
}

function useChatWalkthroughSeen(): [boolean, () => void] {
  const userId = useAuthStore((s) => s.user?.id);
  const key = `zaryah_chat_walkthrough_${userId ?? 'anon'}`;
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { setSeen(localStorage.getItem(key) === '1'); } catch { /* best-effort */ }
  }, [key]);
  const markSeen = useCallback(() => {
    try { localStorage.setItem(key, '1'); } catch { /* best-effort */ }
    setSeen(true);
  }, [key]);
  return [seen, markSeen];
}

export function RayaGatewayPage() {
  useEffect(() => { trackFeature('chatbot'); }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const rayaSend = useRayaSend(navigate);

  const [railOpen, setRailOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);
  const initializedRef = useRef(false);

  const [chatbotSeen, markChatbotSeen] = useDisclaimerSeen('chatbot');
  const [chatWalkthroughSeen, markChatWalkthroughSeen] = useChatWalkthroughSeen();

  const {
    messages,
    selectedCompanion,
    isTyping,
    error,
    backendOnline,
    activeConversationId,
    conversations,
    conversationsLoading,
    historyDrawerOpen,
    insightsData,
    insightsLoading,
    insightsPanelOpen,
    insightsMoodData,
    userProfile,
    weeklyInsights,
    sendUserMessage,
    setCompanion,
    initFromNavState,
    setBackendOnline,
    refreshChartData,
    refreshComparisonData,
    startNewConversation,
    sendGreeting,
    loadConversation,
    deleteConversation,
    cleanupSmallConversations,
    subscribeConversations,
    setHistoryDrawerOpen,
    setInsightsPanelOpen,
    fetchInsights,
    fetchUserProfile,
    chatLanguage,
    setChatLanguage,
    quranAnchor,
    clearQuranAnchor,
  } = useChatbotStore();

  const [showFeedbackPopup, closeFeedbackPopup, openFeedbackPopup] = useChatFeedbackTrigger(messages);

  // The page flips from "calm hero" to "chatting" the moment Raya has anything
  // to show — that's when the full chat chrome slides in.
  const chatting = messages.length > 0 || isTyping;

  // Fetch profile once (needed for age-adaptive voice).
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable zustand action; once on mount
  }, []);

  // ── Honour nav-state handoffs on every navigation in (mount + re-entries) ──
  // Legacy /ai-assistant callers and the floating dock land here with state.
  // Unlike the old chat page we do NOT auto-greet into a thread on a plain
  // visit — the hero IS the greeting. History stays one tap away.
  useEffect(() => {
    const navState = location.state as {
      companionId?: string; initialMessage?: string; chatLanguage?: string;
      newChat?: number; quranAnchor?: QuranAnchor;
    } | null;
    if (!navState) return;

    if (navState.companionId || navState.initialMessage || navState.quranAnchor) {
      initFromNavState(navState);
      if (!navState.initialMessage && !navState.quranAnchor) {
        sendGreeting();
      }
    } else if (navState.newChat) {
      startNewConversation();
    }
    // Clear so a re-render / refresh doesn't replay the handoff.
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable zustand actions; keyed on nav state
  }, [location.state]);

  // Backend health
  useEffect(() => { checkHealth().then(setBackendOnline); }, [setBackendOnline]);

  // Conversation list subscription
  const authUser = useAuthStore((s) => s.user);
  useEffect(() => {
    if (!authUser?.id) return;
    const unsub = subscribeConversations();
    return () => { unsub?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langDropdownOpen]);

  // Pause auto-scroll the instant the user scrolls up during a token stream.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const pause = () => { isUserScrolledUp.current = true; setShowScrollBtn(true); };
    el.addEventListener('wheel', pause, { passive: true });
    el.addEventListener('touchstart', pause, { passive: true });
    return () => {
      el.removeEventListener('wheel', pause);
      el.removeEventListener('touchstart', pause);
    };
  }, [chatting]);

  // Follow new messages unless the user scrolled up.
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom <= 80) {
      isUserScrolledUp.current = false;
      setShowScrollBtn(false);
    } else if (distFromBottom > 150) {
      isUserScrolledUp.current = true;
      setShowScrollBtn(true);
    }
  }, []);

  const scrollToBottom = () => {
    isUserScrolledUp.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Send: deterministic nav-or-chat, then stream in-place ──
  const handleSend = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    if (rayaSend(t) === 'nav') return; // a nav-verb command already navigated away
    isUserScrolledUp.current = false;
    sendUserMessage(t);
  }, [rayaSend, sendUserMessage]);

  const handleSuggestionSelect = useCallback(
    (text: string) => { isUserScrolledUp.current = false; sendUserMessage(text); },
    [sendUserMessage]
  );

  const handlePeriodChange = useMemo(
    () => (messageId: string) => (symbol: string, period: string) => {
      refreshChartData(messageId, symbol, period);
    },
    [refreshChartData]
  );

  const handleComparisonPeriodChange = useMemo(
    () => (messageId: string) => (symbols: string[], period: string) => {
      refreshComparisonData(messageId, symbols, period);
    },
    [refreshComparisonData]
  );

  // Feature navigation with the gold warp, blooming from the centre of the page.
  const goFeature = (route: string) => {
    playWarp({
      origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      accent: '#D4A853',
      onCover: () => navigate(route),
    });
  };
  const onRailSelect = (f: GatewayFeature) => { setRailOpen(false); goFeature(f.route); };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06080D] text-[#F5E8C7] font-sans">
      {!chatbotSeen && <DisclaimerModal contentId="AI_CHATBOT" onAccept={markChatbotSeen} />}

      <RayaStarCanvas />
      {/* ambient washes */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 8%, rgba(212,168,83,0.10), transparent 60%),' +
            'radial-gradient(ellipse 60% 60% at 92% 88%, rgba(42,157,111,0.09), transparent 65%),' +
            'radial-gradient(ellipse 50% 50% at 6% 92%, rgba(212,168,83,0.05), transparent 70%)',
        }}
      />

      {/* Topbar */}
      <header className="fixed top-0 inset-x-0 h-[60px] z-40 flex items-center justify-between px-[18px] sm:px-[26px] backdrop-blur-[14px] bg-gradient-to-b from-[#06080D]/85 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setRailOpen(true)}
            aria-label="Open Raya's Universe menu"
            className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[#C9C0A8] border border-[#F5E8C7]/10 bg-[#F5E8C7]/[0.02] hover:text-[#F5E8C7] hover:border-[#D4A853]/40 transition-colors shrink-0"
          >
            <List size={18} weight="bold" />
          </button>

          {/* Wordmark (hero) ↔ companion selector (chatting) */}
          <AnimatePresence mode="wait" initial={false}>
            {chatting ? (
              <motion.button
                key="companion"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.55, ease: SLOW_EASE, delay: 0.2 }}
                onClick={() => setSelectorOpen(true)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
              >
                <div className="w-9 h-9 rounded-full bg-[#0C0F15]/80 border border-[#D4A853]/30 flex items-center justify-center text-base shrink-0">
                  {selectedCompanion.icon}
                </div>
                <div className="text-left min-w-0 hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-display font-bold text-[#F5E8C7] truncate">{selectedCompanion.name}</span>
                    <CaretDown size={12} className="text-[#D4A853] shrink-0" />
                  </div>
                  <p className="text-[10px] text-[#D4A853]/80 truncate">Tap to switch companion</p>
                </div>
              </motion.button>
            ) : (
              <motion.button
                key="wordmark"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: SLOW_EASE }}
                onClick={() => navigate('/dashboard')}
                className="font-display text-[25px] font-medium tracking-[0.3px] text-[#F5E8C7]"
              >
                Zaryah<b className="text-[#D4A853] font-semibold">+</b>
                <span className="font-arabic text-[14px] text-[#8A8270] ml-2.5 hidden sm:inline">زريّة</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right cluster — calm status (hero) ↔ chat actions (chatting) */}
        <AnimatePresence mode="wait" initial={false}>
          {chatting ? (
            <motion.div
              key="actions"
              variants={ACTIONS_CONTAINER}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex items-center gap-1 sm:gap-1.5"
            >
              <motion.div variants={ACTION_ITEM} className={cn('w-2 h-2 rounded-full mr-0.5', backendOnline ? 'bg-emerald-400' : 'bg-red-400')} title={backendOnline ? 'Raya online' : 'Raya offline'} />

              <motion.button
                variants={ACTION_ITEM}
                onClick={() => setInsightsPanelOpen(true)}
                className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08] transition-colors"
                title="Your insights"
              >
                <Brain size={16} className="text-[#8A8270]" />
              </motion.button>

              <motion.button
                variants={ACTION_ITEM}
                onClick={() => setHistoryDrawerOpen(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08] transition-colors"
                title="Conversation history"
              >
                <ClockCounterClockwise size={16} className="text-[#8A8270]" />
              </motion.button>

              <motion.button
                variants={ACTION_ITEM}
                onClick={openFeedbackPopup}
                className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center bg-[#D4A853]/15 hover:bg-[#D4A853]/25 transition-colors border border-[#D4A853]/20"
                title="Share your feedback — we're in beta!"
              >
                <ChatTeardropDots size={16} weight="duotone" className="text-[#E8C97A]" />
              </motion.button>

              {/* Language selector */}
              <motion.div variants={ACTION_ITEM} ref={langDropdownRef} className="relative">
                <button
                  onClick={() => setLangDropdownOpen((v) => !v)}
                  className={cn(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors',
                    chatLanguage !== 'auto'
                      ? 'bg-[#D4A853]/15 border border-[#D4A853]/20'
                      : 'bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08]'
                  )}
                  title="Chat language"
                >
                  <GlobeSimple size={16} className={chatLanguage !== 'auto' ? 'text-[#E8C97A]' : 'text-[#8A8270]'} />
                </button>
                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-11 z-50 w-48 max-h-72 overflow-y-auto rounded-xl bg-[#0A0E16] border border-[rgba(212,168,83,0.2)] shadow-xl"
                    >
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setChatLanguage(lang.code); setLangDropdownOpen(false); }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                            chatLanguage === lang.code
                              ? 'bg-[#D4A853]/15 text-[#E8C97A]'
                              : 'text-[#C9C0A8] hover:bg-[#F5E8C7]/[0.04] hover:text-[#F5E8C7]'
                          )}
                        >
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.button
                variants={ACTION_ITEM}
                onClick={startNewConversation}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08] transition-colors"
                title="New conversation"
              >
                <PlusCircle size={16} className="text-[#8A8270]" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.span
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: SLOW_EASE }}
              className="hidden sm:flex items-center gap-2 text-[12px] text-[#C9C0A8] tracking-[0.4px] px-3 py-[7px] border border-[#F5E8C7]/10 rounded-full bg-[#F5E8C7]/[0.02]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D6F] shadow-[0_0_8px_#2A9D6F] animate-pulse" />
              Raya is awake
            </motion.span>
          )}
        </AnimatePresence>
      </header>

      {/* Stage */}
      <main className="fixed inset-x-0 bottom-0 top-[60px] z-[5] flex flex-col">
        <div className="relative h-full max-w-[760px] w-full mx-auto flex flex-col px-4 sm:px-7 min-h-0">

          {/* Slow "page turn": hero drifts up and dissolves out while the thread
              eases in beneath it — both layers crossfade over the same space. */}
          <div className="relative flex-1 min-h-0">
            <AnimatePresence initial={false}>
              {chatting ? (
                /* ── Thread ── */
                <motion.div
                  key="thread"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 28 }}
                  transition={{ duration: 0.85, ease: SLOW_EASE }}
                  className="absolute inset-0 z-10 flex flex-col"
                >
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-4"
                  >
                    {messages.map((msg, i) => {
                      let prevUserMsg: string | undefined;
                      if (!msg.isUser) {
                        for (let j = i - 1; j >= 0; j--) {
                          if (messages[j].isUser) { prevUserMsg = messages[j].text; break; }
                        }
                      }
                      return (
                        <ChatMessageBubble
                          key={msg.id}
                          message={msg}
                          companion={selectedCompanion}
                          isLast={i === messages.length - 1 && !msg.isUser}
                          onSuggestionSelect={handleSuggestionSelect}
                          onPeriodChange={handlePeriodChange(msg.id)}
                          onComparisonPeriodChange={handleComparisonPeriodChange(msg.id)}
                          previousUserMessage={prevUserMsg}
                        />
                      );
                    })}

                    {isTyping && !messages[messages.length - 1]?.thinkingContent && (
                      <ChatMessageBubble
                        message={{ id: 'typing', text: '', isUser: false, timestamp: new Date(), isLoading: true }}
                        companion={selectedCompanion}
                        isLast={false}
                        onSuggestionSelect={handleSuggestionSelect}
                      />
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </motion.div>
              ) : (
                /* ── Calm hero ── */
                <motion.div
                  key="hero"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{}}
                  transition={{ duration: 0.85, ease: SLOW_EASE }}
                  className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center"
                >
                  {/* Orb is a sibling of the text so it keeps its own (no-fade)
                      fly-off exit while the text gently fades up and out. */}
                  <RayaHeroOrb />
                  <motion.div
                    exit={{ opacity: 0, y: -28 }}
                    transition={{ duration: 0.7, ease: SLOW_EASE }}
                    className="text-center pb-1"
                  >
                    <div className="font-arabic text-[21px] text-[#E8C97A] opacity-85 mb-6 tracking-[0.5px]">بِسْمِ اللهِ</div>
                    <div className="font-arabic text-[15px] text-[#8A8270] tracking-[3px] uppercase mb-4 flex items-center justify-center gap-3 before:content-[''] before:w-[30px] before:h-px before:bg-gradient-to-r before:from-transparent before:to-[#F5E8C7]/10 after:content-[''] after:w-[30px] after:h-px after:bg-gradient-to-l after:from-transparent after:to-[#F5E8C7]/10">
                      رايا · Raya
                    </div>
                    <h1 className="font-display font-normal leading-[1.08] tracking-[0.2px] mb-[18px] text-[#F5E8C7]" style={{ fontSize: 'clamp(34px,5vw,52px)' }}>
                      Salaam. I&rsquo;m Raya — <br />
                      <em className="not-italic text-[#E8C97A] italic">your way into everything.</em>
                    </h1>
                    <p className="text-[16px] leading-[1.65] text-[#C9C0A8] max-w-[560px] mx-auto mb-[26px] font-light">
                      Zaryah+ isn&rsquo;t a menu of apps you navigate. It&rsquo;s one place where you simply{' '}
                      <b className="text-[#E8C97A] font-medium">ask</b>, and I bring the right tool to you. Tell me what&rsquo;s on your heart.
                    </p>
                    <div className="flex flex-wrap gap-2.5 justify-center max-w-[620px] mx-auto pointer-events-auto">
                      {HERO_CHIPS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => goFeature(c.route)}
                          className="flex items-center gap-[7px] text-[13px] text-[#C9C0A8] font-normal px-[15px] py-[9px] border border-[#F5E8C7]/10 rounded-full bg-[#F5E8C7]/[0.025] hover:border-[#D4A853]/40 hover:bg-[#D4A853]/[0.07] hover:text-[#F5E8C7] transition-all hover:-translate-y-px"
                        >
                          <span className="text-[#D4A853] text-[12px]">✦</span>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scroll-to-bottom FAB */}
            <AnimatePresence>
              {chatting && showScrollBtn && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-2 sm:right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-[#0C0F15]/90 border border-[#D4A853]/30 shadow-lg hover:bg-[#0C0F15]/70 transition-colors"
                >
                  <CaretDown size={16} className="text-[#D4A853]" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Composer rail */}
          <div className="shrink-0 pb-[22px] pt-2.5">
            {quranAnchor && (
              <QuranAnchorPill
                anchor={quranAnchor}
                onClear={clearQuranAnchor}
                onOpen={() =>
                  navigate(`/quran/read?surah=${quranAnchor.surahId ?? quranAnchor.verseKey.split(':')[0]}&verse=${encodeURIComponent(quranAnchor.verseKey)}`)
                }
                onSuggestionTap={handleSuggestionSelect}
                showSuggestions={!chatting}
              />
            )}

            <GatewayComposer
              onSend={handleSend}
              disabled={isTyping}
              placeholder={quranAnchor ? 'Ask about this ayah…' : 'Ask Raya anything — or just tell her what you need…'}
            />

            {chatting ? (
              <>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-red-400/80 mt-2 flex items-center gap-1.5 overflow-hidden"
                    >
                      <WifiSlash size={12} /> {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <DisclaimerBanner contentId="AI_CHATBOT" variant="subtle" className="mt-2" />
              </>
            ) : (
              <div className="text-center text-[11.5px] text-[#4A4639] mt-[11px] tracking-[0.3px]">
                Raya navigates Zaryah+ for you · <b className="text-[#8A8270] font-normal">everything flows through her</b>
              </div>
            )}
          </div>
        </div>
      </main>

      <RayaUniverseRail open={railOpen} onClose={() => setRailOpen(false)} onSelect={onRailSelect} />

      {/* ── Overlays ── */}
      <CompanionSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        selectedId={selectedCompanion.id}
        onSelect={setCompanion}
      />

      <ConversationHistory
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        conversations={conversations}
        loading={conversationsLoading}
        activeId={activeConversationId}
        onSelect={loadConversation}
        onDelete={deleteConversation}
        onNewChat={startNewConversation}
        onCleanup={cleanupSmallConversations}
      />

      <InsightsPanel
        open={insightsPanelOpen}
        onClose={() => setInsightsPanelOpen(false)}
        data={insightsData}
        loading={insightsLoading}
        onRefresh={fetchInsights}
        moodData={insightsMoodData}
        userProfile={userProfile}
        weeklyInsights={weeklyInsights}
      />

      {chatbotSeen && !chatWalkthroughSeen && chatting && (
        <ChatbotWalkthrough onComplete={markChatWalkthroughSeen} />
      )}

      <ChatFeedbackPopup open={showFeedbackPopup} onClose={closeFeedbackPopup} />
    </div>
  );
}

// ==================== Composer ====================

/** The cosmic pill composer — one bar for both hero and chatting states, with
 * speech-to-text parity from the old AI-assistant input. */
function GatewayComposer({
  onSend,
  disabled,
  placeholder,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');
  const { isListening, isSupported, interimTranscript, toggleListening } = useSpeechRecognition({
    lang: 'en-US',
    continuous: false,
    onTranscript: (text, isFinal) => {
      if (isFinal) setValue((prev) => (prev ? `${prev} ${text}` : text));
    },
  });

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue('');
  };

  return (
    <div className="flex items-center gap-2.5 bg-[#0D1016]/75 backdrop-blur-md border border-[#F5E8C7]/10 rounded-[18px] pl-[18px] pr-[7px] py-[7px] focus-within:border-[#D4A853]/45 transition-colors">
      <input
        value={isListening ? `${value}${interimTranscript ? ` ${interimTranscript}` : ''}` : value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder={isListening ? 'Listening… speak now' : placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#F5E8C7] text-[15px] font-light py-[9px] placeholder:text-[#8A8270] disabled:opacity-60"
      />

      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          aria-label={isListening ? 'Stop listening' : 'Speak your question'}
          className={cn(
            'w-[42px] h-[42px] rounded-[13px] shrink-0 flex items-center justify-center transition-all',
            isListening
              ? 'bg-red-500/90 text-[#F5E8C7] animate-pulse'
              : 'bg-[#F5E8C7]/[0.04] text-[#8A8270] hover:text-[#F5E8C7] hover:bg-[#F5E8C7]/[0.08]'
          )}
        >
          {isListening ? <MicrophoneSlash size={18} weight="bold" /> : <Microphone size={18} weight="bold" />}
        </button>
      )}

      <button
        onClick={submit}
        aria-label="Send"
        disabled={disabled}
        className="w-[42px] h-[42px] rounded-[13px] shrink-0 flex items-center justify-center text-[#1a1206] bg-gradient-to-br from-[#E8C97A] to-[#D4A853] hover:brightness-110 hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
      >
        <ArrowRight size={18} weight="bold" />
      </button>
    </div>
  );
}

// ==================== Quran anchor pill ====================

function QuranAnchorPill({
  anchor,
  onClear,
  onOpen,
  onSuggestionTap,
  showSuggestions,
}: {
  anchor: QuranAnchor;
  onClear: () => void;
  onOpen: () => void;
  onSuggestionTap: (text: string) => void;
  showSuggestions: boolean;
}) {
  const label = `${anchor.surahName ?? 'Quran'} · ${anchor.verseKey}`;
  const source = anchor.tafsirSource ?? 'tafsir';
  const subtitle = anchor.tafsir ? `Tafsir from ${source} attached` : 'Verse context attached';

  return (
    <div className="mb-2 rounded-2xl border border-[#D4A853]/25 bg-[#0A0E16]/95 px-3 py-2 border-l-2 border-l-[#D4A853]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${label}`}
          className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-md hover:bg-[#F5E8C7]/[0.04] transition-colors -mx-1 px-1 py-1"
        >
          <span className="shrink-0 w-9 h-9 rounded-full bg-[#D4A853]/15 flex items-center justify-center text-[#D4A853]">
            <BookOpen size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#F5E8C7] truncate">{label}</p>
            <p className="text-xs text-[#8A8270] truncate">{subtitle}</p>
          </span>
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove ayah context"
          className="shrink-0 w-8 h-8 rounded-full bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08] flex items-center justify-center text-[#8A8270]"
        >
          <X size={14} />
        </button>
      </div>
      {showSuggestions && (
        <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {RAYA_ANCHOR_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSuggestionTap(chip)}
              className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08] text-[11px] text-[#C9C0A8] transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
