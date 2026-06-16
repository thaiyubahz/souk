/**
 * Self-healing recovery for the Firestore SDK's intermittent
 * "INTERNAL ASSERTION FAILED: Unexpected state" bug.
 *
 * That assertion is an upstream firebase-js-sdk bug (the app runs ~14 live
 * onSnapshot listeners, which is a heavy trigger), NOT a data problem. When it
 * fires the SDK's internal listener state is wedged and the only reliable fix
 * is to re-init the SDK — i.e. reload the page.
 *
 * Previously this surfaced as a full-screen "Clear Cache & Reload" error that,
 * on click, wiped ALL IndexedDB — including the Firebase Auth session DB
 * (`firebaseLocalStorageDb`) → forced re-login on every recovery.
 *
 * This module makes recovery automatic and invisible:
 *   - intercepts the assertion globally (sync errors + unhandled rejections),
 *   - drops only the corrupt Firestore/cache IndexedDB stores — NEVER the auth
 *     session DB — so the user stays signed in,
 *   - reloads once so the SDK re-inits clean.
 *
 * A short cooldown prevents reload loops: if we already auto-recovered within
 * the last 30s we stand down and let the error boundary render, so a genuinely
 * persistent fault still surfaces instead of looping forever.
 */

const ASSERTION_MARKER = 'INTERNAL ASSERTION FAILED';
const COOLDOWN_KEY = 'zaryah_fs_recover_at';
const COOLDOWN_MS = 30_000;
/** Firebase Auth's IndexedDB store — must survive cache clears or the user is logged out. */
const AUTH_DB = 'firebaseLocalStorageDb';

let recovering = false;

/** True when a thrown value / rejection reason is the Firestore assertion bug. */
export function isFirestoreAssertion(reason: unknown): boolean {
  const msg =
    reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '';
  return msg.includes(ASSERTION_MARKER);
}

/** True if we already auto-recovered very recently — used to avoid reload loops. */
export function recentlyRecovered(): boolean {
  try {
    const last = Number(sessionStorage.getItem(COOLDOWN_KEY) || 0);
    return last > 0 && Date.now() - last < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markRecovered(): void {
  try {
    sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* sessionStorage unavailable (private mode) — proceed without the guard */
  }
}

/** Delete every IndexedDB database EXCEPT the Firebase Auth session store. */
async function clearCachesPreservingAuth(): Promise<void> {
  try {
    const dbs = (await indexedDB.databases?.()) ?? [];
    await Promise.all(
      dbs.map(
        (d) =>
          new Promise<void>((resolve) => {
            if (!d.name || d.name === AUTH_DB) return resolve();
            const req = indexedDB.deleteDatabase(d.name);
            // Resolve on any outcome — recovery must not hang on a blocked delete.
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
          }),
      ),
    );
  } catch {
    /* best-effort — reload anyway */
  }
}

/**
 * Clear corrupt Firestore/cache state (auth preserved) and reload once.
 * No-ops if a recovery is already in flight or we recovered within the cooldown.
 * Returns true if it took action (caller can stop showing fallback UI).
 */
export async function recoverFromFirestoreError(): Promise<boolean> {
  if (recovering || recentlyRecovered()) return false;
  recovering = true;
  await clearCachesPreservingAuth();
  markRecovered();
  window.location.reload();
  return true;
}

/**
 * Install global listeners that auto-recover from the Firestore assertion.
 * Call once, before React mounts. Most occurrences of this bug surface as
 * async onSnapshot failures (unhandled rejections / window errors), which
 * React error boundaries never see — so this is the primary line of defence.
 */
export function installFirestoreRecovery(): void {
  const handle = (reason: unknown): boolean => {
    if (!isFirestoreAssertion(reason)) return false;
    if (recentlyRecovered()) {
      console.error(
        '[FirestoreRecovery] assertion recurred within cooldown — standing down to avoid a reload loop.',
      );
      return false;
    }
    console.warn(
      '[FirestoreRecovery] Firestore assertion detected — clearing cache + reloading (auth preserved).',
    );
    void recoverFromFirestoreError();
    return true;
  };

  window.addEventListener('unhandledrejection', (e) => {
    if (handle(e.reason)) e.preventDefault();
  });
  window.addEventListener('error', (e) => {
    if (handle(e.error ?? e.message)) e.preventDefault();
  });
}
