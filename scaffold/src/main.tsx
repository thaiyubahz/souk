import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSentry, SentryErrorBoundary } from './lib/sentry'
import { installFirestoreRecovery } from './lib/firestoreRecovery'

// Sentry first — before React mounts, so any render-time error in App is captured.
// No-op if VITE_SENTRY_DSN is unset.
initSentry();

// Auto-heal the Firestore SDK's intermittent "INTERNAL ASSERTION FAILED" bug:
// catch it globally and reload clean (auth preserved) instead of dumping the
// user on a "Clear Cache & Reload" screen. Installed before React mounts so it
// catches async onSnapshot failures that error boundaries never see.
installFirestoreRecovery();

// Capture install prompt BEFORE React mounts (it fires early)
window.__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  console.log('PWA: beforeinstallprompt captured');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div role="alert" style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h1>Something went wrong.</h1>
          <p>The error has been reported. Try reloading.</p>
          <button onClick={resetError} type="button">Reload</button>
          {import.meta.env.DEV && <pre>{String(error)}</pre>}
        </div>
      )}
    >
      <App />
    </SentryErrorBoundary>
  </StrictMode>,
)

// Register service worker for PWA + push notifications.
// Check for updates on every app load so new deploys roll out without the
// user having to manually clear site data.
//
// Skip entirely in Capacitor — the native shell does its own update lifecycle
// and registering an SW from the bundled origin can leave a zombie controller
// that causes "clear cache" errors on cold start.
const isCapacitor = typeof window !== 'undefined' &&
  (window as any).Capacitor?.isNativePlatform?.();
// Defer a pending SW update reload until the tab is hidden (user navigated
// away / switched tabs), so the refresh never interrupts an active session or
// races a live Firestore listener. Idempotent — only the first call arms it.
let swReloadArmed = false;
function reloadWhenHidden() {
  if (swReloadArmed) return;
  swReloadArmed = true;
  const onHide = () => {
    if (document.visibilityState === 'hidden') {
      document.removeEventListener('visibilitychange', onHide);
      window.location.reload();
    }
  };
  document.addEventListener('visibilitychange', onHide);
}

if (!isCapacitor && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((reg) => {
      console.log('Service Worker registered:', reg.scope);
      reg.update().catch(() => { });
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'activated' && navigator.serviceWorker.controller) {
            // A fresh SW took over mid-session. DON'T reload immediately —
            // reloading while Firestore listeners are mid-stream is a known
            // trigger of the SDK's INTERNAL ASSERTION FAILED bug, and it yanks
            // the page out from under an active user. Instead, reload the next
            // time the tab is backgrounded, so the user returns on the fresh
            // build without an interruption and without the listener race.
            reloadWhenHidden();
          }
        });
      });
    })
    .catch((err) => console.warn('Service Worker registration failed:', err));
}
