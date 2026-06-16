import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBMiZ1Ll5WQbCfHJU7Knb10Mf1E6xzGLxo",
  authDomain: "souk-ec976.firebaseapp.com",
  databaseURL: "https://souk-ec976-default-rtdb.firebaseio.com",
  projectId: "souk-ec976",
  storageBucket: "souk-ec976.firebasestorage.app",
  messagingSenderId: "586368146054",
  appId: "1:586368146054:web:4758f2eefd1dcbe180cf07",
  measurementId: "G-7K503SZBH9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let analytics: any = null;

if (typeof window !== 'undefined') {
  try {
    // Analytics can fail in local dev or due to ad-blockers
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  } catch (e) {
    console.warn("Firebase Analytics failed to initialize. This is common in local development.");
  }
}

export const isFirebaseConfigured = !!firebaseConfig.apiKey;