/**
 * RayaGlobalDock — the floating Raya orb + chat popup, available on every app
 * page (mounted in MainLayout). Same conversation engine as the gateway: nav
 * commands run the narrated hand-off + gold warp, questions are answered inline.
 *
 * The orb is DRAGGABLE — drag it anywhere; its position is remembered
 * (localStorage) and the chat popup anchors next to wherever you leave it.
 * A click (vs drag) still toggles the popup.
 *
 * Not rendered on the gateway nor on /ai-assistant (the full Raya chat).
 */

import { Component, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGatewayChat } from '../useGatewayChat';
import { RayaGatewayOrb } from './RayaGatewayOrb';
import { RayaChatPopup } from './RayaChatPopup';
import { RayaPageWelcome } from './RayaPageWelcome';
import { resolvePageGuide, type PageGuide } from '../data/pageGuides';

interface RayaGlobalDockProps {
  /** Lift above the mobile bottom nav (true inside MainLayout; false on full-bleed pages). */
  inApp?: boolean;
}

const ORB = 74; // orb size (px)
const POS_KEY = 'raya_orb_pos';
const HINT_KEY = 'raya_orb_hint_seen'; // also gates the one-time "I'm your navigator" tip in the first welcome
const SEEN_KEY = 'raya_page_guides_seen'; // JSON array of guide keys already welcomed
const DRAG_THRESHOLD = 4; // px before a press counts as a drag (not a click)

type Pos = { x: number; y: number };

function loadPos(): Pos | null {
  try {
    const s = localStorage.getItem(POS_KEY);
    return s ? (JSON.parse(s) as Pos) : null;
  } catch {
    return null;
  }
}

function loadSeenGuides(): Set<string> {
  try {
    const s = localStorage.getItem(SEEN_KEY);
    return new Set(s ? (JSON.parse(s) as string[]) : []);
  } catch {
    return new Set();
  }
}

function clampToViewport(x: number, y: number): Pos {
  const m = 8;
  return {
    x: Math.max(m, Math.min(window.innerWidth - ORB - m, x)),
    y: Math.max(m, Math.min(window.innerHeight - ORB - m, y)),
  };
}

/**
 * Guards the orb from the first-visit welcome card: if anything in the welcome
 * throws while rendering, we swallow it and render nothing — the orb (a sibling)
 * must never disappear because of the welcome.
 */
class WelcomeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* non-fatal — the welcome is a nicety, the orb is not */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function RayaGlobalDock({ inApp = true }: RayaGlobalDockProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { messages, isStreaming, send, openFeature, openRoute, openRaya } = useGatewayChat(navigate);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(loadPos);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  // First-visit welcome: the first time a user reaches a feature area, Raya
  // greets them with a short summary + what they can do here. Shown once per
  // area (tracked in localStorage), never randomly.
  const seen = useRef<Set<string>>(loadSeenGuides());
  const [welcome, setWelcome] = useState<PageGuide | null>(null);
  // True only until the very first welcome is dismissed — folds the one-time
  // "I'm your navigator" tip into it (reusing the old HINT_KEY flag).
  const firstRun = useRef<boolean>((() => {
    try {
      return !localStorage.getItem(HINT_KEY);
    } catch {
      return false;
    }
  })());

  // Greet on each new area as the user explores. Runs on mount + every nav.
  useEffect(() => {
    const guide = resolvePageGuide(location.pathname);
    if (seen.current.has(guide.key)) return;
    if (open) return; // never interrupt an open chat
    seen.current.add(guide.key);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen.current]));
    } catch { /* ignore */ }
    setWelcome(guide);
  }, [location.pathname, open]);

  const settleFirstRun = useCallback(() => {
    if (!firstRun.current) return;
    firstRun.current = false;
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch { /* ignore */ }
  }, []);

  const dismissWelcome = useCallback(() => {
    setWelcome(null);
    settleFirstRun();
  }, [settleFirstRun]);

  // "Ask me about this →" — open the chat and let Raya describe the place.
  const askAboutWelcome = useCallback(() => {
    const g = welcome;
    setWelcome(null);
    settleFirstRun();
    setOpen(true);
    if (g) send(`What can I do here in ${g.title}?`);
  }, [welcome, send, settleFirstRun]);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    drag.current = { active: true, moved: false, sx: e.clientX, sy: e.clientY, ox: rect.left, oy: rect.top };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (!drag.current.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      drag.current.moved = true;
      setDragging(true);
    }
    if (drag.current.moved) setPos(clampToViewport(drag.current.ox + dx, drag.current.oy + dy));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (drag.current.moved) {
      setDragging(false);
      setPos((p) => {
        if (p) {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(p));
          } catch { /* ignore */ }
        }
        return p;
      });
    }
  };

  const handleClick = () => {
    // Suppress the click that follows a drag.
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    if (welcome) dismissWelcome();
    setOpen((v) => !v);
  };

  // Clamp the remembered position to the CURRENT viewport on every render. A
  // position saved on a larger window (or before a resize/rotate) must never
  // place the orb off-screen — otherwise the dock looks "missing" on every page.
  const safePos = pos && typeof window !== 'undefined' ? clampToViewport(pos.x, pos.y) : null;

  // Orb position style (only once dragged — otherwise the CSS default applies).
  const orbStyle: CSSProperties | undefined = safePos
    ? { left: safePos.x, top: safePos.y, right: 'auto', bottom: 'auto' }
    : undefined;

  // Anchor the popup next to the orb's current position.
  let popupStyle: CSSProperties | undefined;
  if (safePos && typeof window !== 'undefined') {
    const PW = Math.min(380, window.innerWidth - 36);
    const gap = 12;
    const onTop = safePos.y < window.innerHeight / 2;
    const onLeft = safePos.x + ORB / 2 < window.innerWidth / 2;
    const left = onLeft ? safePos.x : safePos.x + ORB - PW;
    const s: CSSProperties = {
      left: Math.max(8, Math.min(window.innerWidth - PW - 8, left)),
      right: 'auto',
    };
    if (onTop) {
      s.top = safePos.y + ORB + gap;
      s.bottom = 'auto';
    } else {
      s.bottom = window.innerHeight - safePos.y + gap;
      s.top = 'auto';
    }
    popupStyle = s;
  }

  return (
    <>
      {/* First-visit welcome — Raya introduces each new area, once.
          Boundary-wrapped so it can never take the orb down with it. */}
      <WelcomeBoundary>
        {welcome && !open && (
          <RayaPageWelcome
            guide={welcome}
            firstRun={firstRun.current}
            inApp={inApp}
            anchorStyle={popupStyle}
            onDismiss={dismissWelcome}
            onOpenChat={askAboutWelcome}
          />
        )}
      </WelcomeBoundary>

      <RayaGatewayOrb
        onClick={handleClick}
        active={open}
        inApp={inApp}
        style={orbStyle}
        dragging={dragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <RayaChatPopup
        open={open}
        onClose={() => setOpen(false)}
        messages={messages}
        isStreaming={isStreaming}
        onSend={send}
        onSelectFeature={openFeature}
        onSelectRoute={openRoute}
        onOpenRaya={openRaya}
        inApp={inApp}
        anchorStyle={popupStyle}
      />
    </>
  );
}
