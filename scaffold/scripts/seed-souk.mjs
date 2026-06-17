/**
 * Souk database seeder.
 *
 * Loads the sample listings + sellers (from public/mock-data) into Cloud
 * Firestore so the Souk has real data to display. Reads the Firebase config
 * from .env (same values the app uses) so no keys live in this file.
 *
 * Run from the `scaffold` folder:  node scripts/seed-souk.mjs
 *
 * Requires Firestore to allow writes — true while the database is in
 * "test mode" (the default for the first 30 days).
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Parse .env (tiny KEY=VALUE reader) so the script and the app share one source
// of config — and the keys stay out of git.
const envText = readFileSync(join(here, '..', '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const readJson = (...p) => JSON.parse(readFileSync(join(here, '..', ...p), 'utf8'));
const listings = readJson('public', 'mock-data', 'listings.json');
const sellers = readJson('public', 'mock-data', 'sellers.json');
const sellerById = Object.fromEntries(sellers.map((s) => [s.id, s]));

console.log(`Seeding into Firebase project "${firebaseConfig.projectId}"...\n`);

// Shape each listing into the fields the Souk's product subscription reads.
for (const l of listings) {
  const seller = sellerById[l.sellerId];
  const isService = l.condition === 'service';
  await setDoc(doc(db, 'products', l.id), {
    name: l.title,
    seller: seller?.name ?? 'Community Seller',
    category: l.category,
    price: l.price?.amount ?? 0,
    unit: isService ? 'per service' : l.isFreebie ? 'free' : 'per item',
    rating: seller?.ratingAvg ?? 4.8,
    reviews: l.interestCount ?? 0,
    badge: l.isFreebie ? 'Free' : null,
    type: 'sale',
    location: l.location ?? 'Remote',
    img: l.images?.[0] ?? 'sparkle',
    tags: l.tags ?? [],
    description: l.description ?? '',
    sellerPhone: '',
    sellerId: l.sellerId ?? '',
    createdAt: l.createdAt ?? new Date().toISOString(),
  });
  console.log('  product  ', l.id, '-', l.title);
}

for (const s of sellers) {
  await setDoc(doc(db, 'sellers', s.id), s);
  console.log('  seller   ', s.id, '-', s.name);
}

console.log(`\nDone: ${listings.length} products + ${sellers.length} sellers seeded.`);
process.exit(0);
