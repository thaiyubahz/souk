import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

// Config is read from environment variables (see .env). Keeping the values out
// of source code means the keys are never committed to git, and we can point at
// a different Firebase project later by changing .env alone — not the code.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// True when real Firebase keys are present (not the placeholder text shipped in
// the sample .env). When false, the app still runs but Firebase is inert.
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_api_key";

// "Stub mode" — the inverse flag the rest of the app checks to skip live calls
// (auth store, kyc store, chatbot, onboarding) when Firebase isn't configured.
export const isFirebaseStubbed = !isFirebaseConfigured;

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// App Check is optional and not used in the prototype (it needs a reCAPTCHA site
// key). Exported as null so callers that guard on it (see src/lib/api.ts) safely
// skip it instead of failing to import.
export const appCheck = null;

// Analytics only initializes in the browser and only when a measurementId is set.
// It commonly fails behind ad-blockers / in local dev, so we swallow errors.
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch {
    console.warn("Firebase Analytics failed to initialize (normal in local dev).");
  }
}
