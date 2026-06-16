/**
 * gatewayFeatures.ts — the "Raya's Universe" registry for the immersive home.
 *
 * Each entry maps a poetic mockup feature to a REAL existing app route. The
 * left menu (hamburger), the hero chips, and Raya's lines all read from here.
 * `status: 'soon'` features still navigate (their route renders a ComingSoon
 * page); they just carry a badge.
 */

export type GatewayGroup = 'Start here' | 'Your practice' | 'Your life' | 'Your ummah' | 'On the horizon';

export interface GatewayFeature {
  id: string;
  name: string;
  /** Arabic label shown beside the name. */
  ar: string;
  /** One-line description for the menu. */
  railDesc: string;
  /** Real route this opens. */
  route: string;
  group: GatewayGroup;
  status: 'live' | 'soon';
  /** Per-feature accent (hex) and its soft rgba — from the os mockup. */
  accent: string;
  accentSoft: string;
  /** Inner SVG markup (24x24, stroke=currentColor) for the menu icon. */
  icon: string;
  /** Raya's transition line when she opens it (HTML-free text). */
  intro: string;
  /** Hero quick-chip label (omit to keep it out of the hero chips). */
  chip?: string;
  /**
   * Special selection behaviour instead of route navigation. `'whatsapp'`
   * opens the Raya-on-WhatsApp instructions modal (handled by the gateway).
   */
  action?: 'whatsapp';
}

// 24x24 icon paths (stroke=currentColor), ported from the raya-os mockup.
const ICONS = {
  raya: '<path d="M12 3a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V12a2 2 0 0 1-4 0v-1.5C8.8 9.8 8 8.5 8 7a4 4 0 0 1 4-4Z"/><path d="M6 21c0-3 2.7-5 6-5s6 2 6 5"/>',
  baraka: '<path d="M12 2l2.2 6.6H21l-5.4 4 2 6.6L12 15.5 6.4 19.2l2-6.6L3 8.6h6.8z"/>',
  quran: '<path d="M3 5.5C3 4.7 3.7 4 4.5 4H11v15H4.5A1.5 1.5 0 0 1 3 17.5z"/><path d="M21 5.5C21 4.7 20.3 4 19.5 4H13v15h6.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  eim: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-2.5 6h5z"/><path d="M19 7l-2.5 6h5z"/><path d="M8 21h8"/>',
  sakinah: '<path d="M12 21s-7-4.5-9.3-9C1 8.5 2.8 5 6.2 5 8.4 5 10 6.5 12 8c2-1.5 3.6-3 5.8-3 3.4 0 5.2 3.5 3.5 7-2.3 4.5-9.3 9-9.3 9z"/>',
  halaqah: '<circle cx="12" cy="8" r="3"/><path d="M5 21c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/>',
  looop: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>',
  souk: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9h16v11H4z"/><path d="M9 20v-6h6v6"/>',
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  whatsapp: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/><path d="M8.6 8.8c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c0 .2 0 .4-.1.5l-.5.6c-.1.1-.2.3-.1.5.4.7 1.3 1.6 2.1 2 .2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .6-.4 1.3-1 1.5-.6.2-1.3.2-3-.5-2-.9-3.4-2.9-3.8-3.5-.4-.6-.9-1.6-.9-2.4 0-.4.1-.6.3-.8Z"/>',
};

export const GATEWAY_FEATURES: GatewayFeature[] = [
  {
    id: 'raya',
    name: 'Raya',
    ar: 'رايا',
    railDesc: 'Companion · your guide inside Zaryah+',
    route: '/raya-gateway',
    group: 'Start here',
    status: 'live',
    accent: '#D4A853',
    accentSoft: 'rgba(212,168,83,0.13)',
    icon: ICONS.raya,
    intro: "That's me. Ask me anything — I'm the layer everything here runs through.",
  },
  {
    id: 'whatsapp',
    name: 'Raya on WhatsApp',
    ar: 'واتساب',
    railDesc: 'Link WhatsApp + Google connectors',
    route: '/raya',
    group: 'Start here',
    status: 'live',
    accent: '#25D366',
    accentSoft: 'rgba(37,211,102,0.13)',
    icon: ICONS.whatsapp,
    intro: 'Let me show you how to reach me on WhatsApp — same memory, no app needed.',
    chip: 'Chat on WhatsApp',
    action: 'whatsapp',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    ar: 'لوحة',
    railDesc: 'Your widgets & overview',
    route: '/dashboard',
    group: 'Start here',
    status: 'live',
    accent: '#D4A853',
    accentSoft: 'rgba(212,168,83,0.13)',
    icon: ICONS.dashboard,
    intro: 'Opening your dashboard — prayer times, reflection and more.',
  },
  {
    id: 'baraka',
    name: 'Baraka',
    ar: 'بركة',
    railDesc: 'Gratitude & Shukr',
    route: '/barakah-labs',
    group: 'Your practice',
    status: 'live',
    accent: '#2A9D6F',
    accentSoft: 'rgba(42,157,111,0.13)',
    icon: ICONS.baraka,
    intro: 'Taking you to Baraka — your gratitude space. Notice something small.',
    chip: 'Notice a blessing',
  },
  {
    id: 'quran',
    name: 'Qur’an with Raya',
    ar: 'القرآن',
    railDesc: 'Reflective reading',
    route: '/quran',
    group: 'Your practice',
    status: 'live',
    accent: '#3E9E8E',
    accentSoft: 'rgba(62,158,142,0.14)',
    icon: ICONS.quran,
    intro: "Opening the Qur’an. Let's read and reflect together.",
    chip: 'Read the Qur’an',
  },
  {
    id: 'eim',
    name: 'EIM',
    ar: '',
    railDesc: 'Halal wealth · Islamic finance',
    route: '/eim',
    group: 'Your life',
    status: 'live',
    accent: '#D4A853',
    accentSoft: 'rgba(200,162,74,0.14)',
    icon: ICONS.eim,
    intro: "Here's EIM — your wealth through the lens of balance, fully halal-screened.",
    chip: 'Balance my wealth',
  },
  {
    id: 'sakinah',
    name: 'Sakinah',
    ar: 'سكينة',
    railDesc: 'Marriage · matchmaking',
    route: '/matrimony',
    group: 'Your life',
    status: 'soon',
    accent: '#C58A8A',
    accentSoft: 'rgba(197,138,138,0.15)',
    icon: ICONS.sakinah,
    intro: 'Opening Sakinah gently. Everything here is private and safe — I’ll guide you.',
    chip: 'Find a spouse',
  },
  {
    id: 'halaqah',
    name: 'Halaqah',
    ar: 'حلقة',
    railDesc: 'Circles · gatherings',
    route: '/halaqah',
    group: 'Your life',
    status: 'soon',
    accent: '#6E93B8',
    accentSoft: 'rgba(110,147,184,0.15)',
    icon: ICONS.halaqah,
    intro: 'Bringing you Halaqah — circles and gatherings near you.',
    chip: 'Find a circle',
  },
  {
    id: 'looop',
    name: 'Looop',
    ar: 'لوب',
    railDesc: 'Ventures · the community’s launchpad',
    route: '/shark-tank',
    group: 'On the horizon',
    status: 'soon',
    accent: '#527E9E',
    accentSoft: 'rgba(82,126,158,0.12)',
    icon: ICONS.looop,
    intro: 'Looop is on the horizon — the place for ventures and builders.',
  },
  {
    id: 'souk',
    name: 'Online Souk',
    ar: 'سوق',
    railDesc: 'A trusted, verified marketplace',
    route: '/souk',
    group: 'On the horizon',
    status: 'live',
    accent: '#B98A4A',
    accentSoft: 'rgba(185,138,74,0.13)',
    icon: ICONS.souk,
    intro: 'Opening the Souk — only verified, halal-checked vendors. What are you after?',
    chip: 'Browse the Souk',
  },
];

/** Grouped, in menu display order. */
export const GATEWAY_GROUP_ORDER: GatewayGroup[] = [
  'Start here',
  'Your practice',
  'Your life',
  'Your ummah',
  'On the horizon',
];

export function featuresByGroup(): Record<GatewayGroup, GatewayFeature[]> {
  const out = {} as Record<GatewayGroup, GatewayFeature[]>;
  for (const g of GATEWAY_GROUP_ORDER) out[g] = [];
  for (const f of GATEWAY_FEATURES) out[f.group].push(f);
  return out;
}

/** Hero quick-chips — already-LIVE features only. Most go straight to their page;
 * `action: 'whatsapp'` opens the Raya-on-WhatsApp modal instead of navigating. */
export const HERO_CHIPS: { id: string; label: string; route: string; action?: 'whatsapp' }[] = [
  { id: 'whatsapp', label: 'Chat on WhatsApp', route: '/settings/whatsapp', action: 'whatsapp' },
  { id: 'baraka', label: 'Notice a blessing', route: '/barakah-labs' },
  { id: 'quran', label: 'Read the Qur’an', route: '/quran' },
  { id: 'eim', label: 'Balance my wealth', route: '/eim' },
  { id: 'wallet', label: 'Check my wallet', route: '/wallet' },
  { id: 'prayer', label: 'See my prayer times', route: '/prayer-times' },
];
