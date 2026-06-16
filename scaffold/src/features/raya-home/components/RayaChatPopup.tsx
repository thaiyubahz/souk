/**
 * RayaChatPopup — compact floating Raya chat, anchored above the orb.
 * Primarily for navigation (quick feature chips + nav-phrase typing), but also
 * answers questions inline. The narrated "taking you there" hand-off + gold warp
 * (from useGatewayChat) play right here in the thread.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, X } from '@phosphor-icons/react';
// import { NavigateLinks } from '@/features/chatbot/components/NavigateLinks'; // nav cards hidden in popup
import { GATEWAY_FEATURES, type GatewayFeature } from '../data/gatewayFeatures';
import type { GatewayMessage } from '../useGatewayChat';

interface RayaChatPopupProps {
  open: boolean;
  onClose: () => void;
  messages: GatewayMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onSelectFeature: (feature: GatewayFeature) => void;
  /** Tap an ambiguous-intent suggestion → navigate there. */
  onSelectRoute: (route: string, label?: string) => void;
  /** Open the full Raya assistant for a detailed topic, carrying the question. */
  onOpenRaya: (question?: string) => void;
  /** Lift above the mobile bottom nav when used as the global in-app dock. */
  inApp?: boolean;
  /** Inline position override (anchors the popup next to a dragged orb). */
  anchorStyle?: CSSProperties;
}

export function RayaChatPopup({
  open,
  onClose,
  messages,
  isStreaming,
  onSend,
  onSelectFeature,
  onSelectRoute,
  onOpenRaya,
  inApp,
  anchorStyle,
}: RayaChatPopupProps) {
  const [input, setInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const submit = () => {
    const t = input.trim();
    if (!t) return;
    setInput('');
    onSend(t);
  };

  return (
    <>
      <style>{POPUP_CSS}</style>
      <div role="dialog" aria-label="Raya" aria-hidden={!open} style={anchorStyle} className={`rcp ${open ? 'rcp-open' : ''}${inApp ? ' rcp-inapp' : ''}`}>
        {/* Header */}
        <div className="rcp-head">
          <div className="rcp-head-l">
            <span className="rcp-miniorb" />
            <span className="rcp-title">Raya</span>
            <span className="rcp-sub">navigation &amp; answers</span>
          </div>
          <button className="rcp-x" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Quick nav chips */}
        <div className="rcp-chips">
          {GATEWAY_FEATURES.filter((f) => f.id !== 'raya').map((f) => (
            <button
              key={f.id}
              className="rcp-chip"
              style={{ ['--fc' as string]: f.accent }}
              onClick={() => onSelectFeature(f)}
            >
              <span className="rcp-chip-ar" style={{ color: f.accent }}>
                {f.ar}
              </span>
              {f.name}
              {f.status === 'soon' && <span className="rcp-soon">Soon</span>}
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="rcp-body" ref={bodyRef}>
          {messages.map((m) => (
            <div key={m.id} className={`rcp-msg ${m.role === 'user' ? 'rcp-user' : 'rcp-raya'}`}>
              {m.role === 'raya' && <span className="rcp-miniorb rcp-ava" />}
              <div className="rcp-bubble">
                {m.streaming && !m.text ? (
                  <span className="rcp-typing">
                    <i /> <i /> <i />
                  </span>
                ) : (
                  <span className="rcp-text">{m.text}</span>
                )}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="rcp-suggest">
                    {m.suggestions.map((s) => (
                      <button key={s.route} className="rcp-suggest-btn" onClick={() => onSelectRoute(s.route, s.label)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                {/* Nav cards hidden in the popup — kept only on the main Raya chat. */}
                {/* {m.navigateLinks && m.navigateLinks.length > 0 && <NavigateLinks links={m.navigateLinks} />} */}
                {m.rayaHandoff && (
                  <button className="rcp-raya-link" onClick={() => onOpenRaya(m.rayaHandoff)}>
                    Open Raya for the full answer →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="rcp-input">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="Take me to… or ask anything"
          />
          <button onClick={submit} disabled={isStreaming} aria-label="Send" className="rcp-send">
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </>
  );
}

const POPUP_CSS = `
.rcp{position:fixed;right:30px;bottom:118px;z-index:47;width:min(380px,calc(100vw - 36px));max-height:min(70vh,560px);
  display:flex;flex-direction:column;border-radius:20px;overflow:hidden;
  background:rgba(6,8,13,0.96);border:1px solid rgba(212,168,83,0.18);backdrop-filter:blur(20px);
  box-shadow:0 30px 80px -20px rgba(0,0,0,0.85);
  opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;
  transition:opacity .3s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.16,1,.3,1);}
.rcp-open{opacity:1;transform:none;pointer-events:auto;}
.rcp-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(245,232,199,0.06);}
.rcp-head-l{display:flex;align-items:center;gap:10px;}
.rcp-title{font-family:'Cormorant Garamond',serif;font-size:18px;color:#F5E8C7;}
.rcp-sub{font-size:11px;color:#8A8270;letter-spacing:.04em;}
.rcp-x{color:#8A8270;display:flex;}.rcp-x:hover{color:#F5E8C7;}
.rcp-miniorb{width:28px;height:28px;border-radius:50%;flex:0 0 auto;
  background:radial-gradient(circle at 35% 30%, #E8C97A, #D4A853 45%, #2A9D6F 120%);
  box-shadow:0 0 12px rgba(212,168,83,0.4), inset 0 0 6px rgba(255,255,255,0.25);}
.rcp-chips{display:flex;gap:7px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid rgba(245,232,199,0.06);max-height:118px;overflow-y:auto;}
.rcp-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#C9C0A8;
  padding:6px 11px;border:1px solid rgba(245,232,199,0.1);border-radius:999px;background:rgba(245,232,199,0.02);
  transition:.2s;}
.rcp-chip:hover{color:#F5E8C7;border-color:var(--fc,#D4A853);background:rgba(212,168,83,0.06);}
.rcp-chip-ar{font-family:'Amiri',serif;font-size:12px;}
.rcp-soon{font-size:9px;letter-spacing:.5px;text-transform:uppercase;color:#4A4639;border:1px solid rgba(245,232,199,0.1);padding:1px 5px;border-radius:999px;}
.rcp-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;min-height:90px;}
.rcp-body::-webkit-scrollbar,.rcp-chips::-webkit-scrollbar{width:5px;}
.rcp-body::-webkit-scrollbar-thumb,.rcp-chips::-webkit-scrollbar-thumb{background:rgba(245,232,199,0.1);border-radius:8px;}
.rcp-msg{display:flex;gap:9px;max-width:90%;}
.rcp-user{align-self:flex-end;flex-direction:row-reverse;}
.rcp-ava{width:24px;height:24px;margin-top:2px;}
.rcp-bubble{font-size:13.5px;line-height:1.55;font-weight:300;padding:10px 13px;border-radius:14px;}
.rcp-raya .rcp-bubble{background:#11141C;border:1px solid rgba(245,232,199,0.08);color:#F5E8C7;border-top-left-radius:5px;}
.rcp-user .rcp-bubble{background:linear-gradient(135deg,rgba(212,168,83,0.16),rgba(212,168,83,0.08));border:1px solid rgba(212,168,83,0.25);color:#F5E8C7;border-top-right-radius:5px;}
.rcp-text{white-space:pre-wrap;}
.rcp-suggest{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;}
.rcp-suggest-btn{font-size:12px;color:#F5E8C7;padding:6px 12px;border-radius:999px;border:1px solid rgba(212,168,83,0.35);background:rgba(212,168,83,0.08);transition:.2s;}
.rcp-suggest-btn:hover{background:rgba(212,168,83,0.16);border-color:rgba(212,168,83,0.6);}
.rcp-raya-link{display:inline-flex;margin-top:9px;font-size:12px;font-weight:500;color:#E8C97A;padding:7px 13px;border-radius:11px;border:1px solid rgba(212,168,83,0.4);background:rgba(212,168,83,0.1);transition:.2s;}
.rcp-raya-link:hover{background:rgba(212,168,83,0.2);color:#F5E8C7;}
.rcp-typing{display:inline-flex;gap:4px;align-items:center;padding:2px 0;}
.rcp-typing i{width:5px;height:5px;border-radius:50%;background:#8A8270;animation:rcpBlink 1.3s infinite;}
.rcp-typing i:nth-child(2){animation-delay:.18s;}.rcp-typing i:nth-child(3){animation-delay:.36s;}
.rcp-input{display:flex;align-items:center;gap:8px;padding:10px 10px 12px 14px;border-top:1px solid rgba(245,232,199,0.06);}
.rcp-input input{flex:1;background:none;border:none;outline:none;color:#F5E8C7;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:300;}
.rcp-input input::placeholder{color:#8A8270;}
.rcp-send{width:36px;height:36px;border-radius:11px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;
  color:#1a1206;background:linear-gradient(135deg,#E8C97A,#D4A853);transition:.2s;}
.rcp-send:hover{filter:brightness(1.08);}.rcp-send:disabled{opacity:.6;}
@keyframes rcpBlink{0%,60%,100%{opacity:.25;transform:translateY(0);}30%{opacity:1;transform:translateY(-3px);}}
@media (max-width:760px){.rcp{right:18px;bottom:96px;}.rcp.rcp-inapp{bottom:158px;}}
@media (prefers-reduced-motion:reduce){.rcp{transition:opacity .15s;}.rcp-typing i{animation:none;}}
`;
