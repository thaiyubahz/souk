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

// Extra demo sellers + listings so the marketplace and discovery rows look full.
const EXTRA_SELLERS = [
  { id: 'sel_005', name: 'Modest Threads Co.', handle: '@modestthreads', avatar: 'https://i.pravatar.cc/150?img=5', location: 'London, UK', trustScore: 84, trustBadge: 'verified', joinedAt: '2024-11-02', bio: 'Ethically-made modest clothing & activewear.', responseTime: 'usually replies within 3 hours', ratingsCount: 27, ratingAvg: 4.7 },
  { id: 'sel_006', name: 'Tech Halal', handle: '@techhalal', avatar: 'https://i.pravatar.cc/150?img=8', location: 'Dubai, AE', trustScore: 68, trustBadge: 'new', joinedAt: '2025-03-19', bio: 'Refurbished, ethically-sourced electronics.', responseTime: 'usually replies within a day', ratingsCount: 6, ratingAvg: 4.5 },
];

const EXTRA_LISTINGS = [
  { id: 'lst_2001', title: 'Prayer mat with memory foam', category: 'products', sellerId: 'sel_005', description: 'Thick, supportive prayer mat with a non-slip base.', images: ['https://picsum.photos/seed/prayermat/600/450'], price: { amount: 35, currency: 'GBP' }, location: 'London, UK', condition: 'new', tags: ['prayer', 'home'], createdAt: '2026-06-12T09:00:00Z', interestCount: 18, isFreebie: false },
  { id: 'lst_2002', title: 'Refurbished laptop (1-yr warranty)', category: 'products', sellerId: 'sel_006', description: 'Fully tested refurbished laptop, includes warranty.', images: ['https://picsum.photos/seed/laptop2/600/450'], price: { amount: 320, currency: 'USD' }, location: 'Dubai, AE', condition: 'used', tags: ['tech', 'laptop'], createdAt: '2026-06-13T11:30:00Z', interestCount: 25, isFreebie: false },
  { id: 'lst_2003', title: 'Part-time bakery assistant (halal kitchen)', category: 'jobs', sellerId: 'sel_003', description: 'Weekend help wanted in a halal home bakery.', images: ['https://picsum.photos/seed/bakeryjob/600/450'], price: { amount: 0, currency: 'MYR' }, location: 'Kuala Lumpur, MY', condition: 'service', tags: ['job', 'bakery'], createdAt: '2026-06-14T08:00:00Z', interestCount: 12, isFreebie: false },
  { id: 'lst_2004', title: 'Car rental — weekly, halal terms', category: 'rentals', sellerId: 'sel_006', description: 'Clean sedan available weekly. Simple, transparent terms.', images: ['https://picsum.photos/seed/carrent/600/450'], price: { amount: 150, currency: 'USD' }, location: 'Dubai, AE', condition: 'used', tags: ['rental', 'car'], createdAt: '2026-06-11T16:00:00Z', interestCount: 9, isFreebie: false },
  { id: 'lst_2005', title: 'Free dates — surplus from a community event', category: 'giveaways', sellerId: 'sel_003', description: 'Boxes of quality dates left over from an event. Pickup only.', images: ['https://picsum.photos/seed/dates/600/450'], price: { amount: 0, currency: 'MYR' }, location: 'Kuala Lumpur, MY', condition: 'new', tags: ['free', 'food'], createdAt: '2026-06-15T07:30:00Z', interestCount: 40, isFreebie: true },
  { id: 'lst_2006', title: 'Tafsir book set (3 volumes)', category: 'islamic', sellerId: 'sel_001', description: 'Gently used 3-volume tafsir set in great condition.', images: ['https://picsum.photos/seed/tafsir/600/450'], price: { amount: 50, currency: 'GBP' }, location: 'Birmingham, UK', condition: 'used', tags: ['islamic', 'books'], createdAt: '2026-06-10T13:00:00Z', interestCount: 22, isFreebie: false },
  { id: 'lst_2007', title: 'Logo design for Muslim-owned brands', category: 'freelancers', sellerId: 'sel_002', description: 'Clean, modern logo design with two revision rounds.', images: ['https://picsum.photos/seed/logo/600/450'], price: { amount: 120, currency: 'CAD' }, location: 'Remote', condition: 'service', tags: ['design', 'freelance'], createdAt: '2026-06-12T18:00:00Z', interestCount: 15, isFreebie: false },
  { id: 'lst_2008', title: 'Home-cooked biryani (weekend orders)', category: 'local', sellerId: 'sel_003', description: 'Fragrant chicken biryani, made fresh on weekends.', images: ['https://picsum.photos/seed/biryani/600/450'], price: { amount: 20, currency: 'MYR' }, location: 'Kuala Lumpur, MY', condition: 'new', tags: ['food', 'local'], createdAt: '2026-06-14T19:00:00Z', interestCount: 30, isFreebie: false },
  { id: 'lst_2009', title: 'Arabic calligraphy workshop (online)', category: 'services', sellerId: 'sel_004', description: 'Beginner-friendly online calligraphy session.', images: ['https://picsum.photos/seed/calligraphy2/600/450'], price: { amount: 25, currency: 'USD' }, location: 'Online', condition: 'service', tags: ['art', 'workshop'], createdAt: '2026-06-13T10:00:00Z', interestCount: 14, isFreebie: false },
  { id: 'lst_2010', title: 'Modest activewear set', category: 'products', sellerId: 'sel_005', description: 'Breathable, full-coverage activewear set.', images: ['https://picsum.photos/seed/activewear/600/450'], price: { amount: 45, currency: 'GBP' }, location: 'London, UK', condition: 'new', tags: ['modest', 'clothing'], createdAt: '2026-06-15T12:00:00Z', interestCount: 19, isFreebie: false },
  { id: 'lst_2011', title: 'Free Islamic posters (digital download)', category: 'digital', sellerId: 'sel_001', description: 'Set of printable Islamic art posters. Free to download.', images: ['https://picsum.photos/seed/posters/600/450'], price: { amount: 0, currency: 'GBP' }, location: 'Digital', condition: 'digital', tags: ['free', 'digital', 'art'], createdAt: '2026-06-16T09:00:00Z', interestCount: 28, isFreebie: true },
  { id: 'lst_2012', title: 'Prayer beads collection (gently used)', category: 'products', sellerId: 'sel_005', description: 'A small collection of prayer beads (tasbih).', images: ['https://picsum.photos/seed/beads/600/450'], price: { amount: 12, currency: 'GBP' }, location: 'London, UK', condition: 'used', tags: ['prayer', 'accessories'], createdAt: '2026-06-09T15:00:00Z', interestCount: 7, isFreebie: false },
];

const listings = [...readJson('public', 'mock-data', 'listings.json'), ...EXTRA_LISTINGS];
const sellers = [...readJson('public', 'mock-data', 'sellers.json'), ...EXTRA_SELLERS];
const sellerById = Object.fromEntries(sellers.map((s) => [s.id, s]));

console.log(`Seeding into Firebase project "${firebaseConfig.projectId}"...\n`);

// Shape each listing into the fields the Souk's product subscription reads.
let okProducts = 0;
let okSellers = 0;
for (const l of listings) {
  const seller = sellerById[l.sellerId];
  const isService = l.condition === 'service';
  const product = {
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
  };
  try {
    await setDoc(doc(db, 'products', l.id), product);
    okProducts++;
    console.log('  product  ', l.id, '-', l.title);
  } catch (e) {
    console.log('  SKIP product', l.id, '-', e.message);
  }
}

for (const s of sellers) {
  // Existing sellers can't be re-written once the locked rules are published —
  // that's fine, they're already in the database. New ones get created.
  try {
    await setDoc(doc(db, 'sellers', s.id), s);
    okSellers++;
    console.log('  seller   ', s.id, '-', s.name);
  } catch (e) {
    console.log('  SKIP seller ', s.id, '-', e.message);
  }
}

console.log(`\nDone: ${okProducts}/${listings.length} products + ${okSellers}/${sellers.length} sellers written.`);
process.exit(0);
