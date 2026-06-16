/**
 * pageGuides.ts — per-page "first visit" welcome content for the floating Raya
 * dock (RayaGlobalDock).
 *
 * The FIRST time a user lands on a feature area, Raya greets them with a short,
 * first-person summary of what the place is + a few things they can do here. We
 * track which guides have been seen in localStorage so it shows once per area,
 * never randomly.
 *
 * Matching is longest-prefix: `/quran/hifz` wins over `/quran` for a hifz page.
 * Anything unmatched falls back to GENERIC_GUIDE, so every page is covered.
 *
 * Copy is in Raya's voice (warm, first person). `soon: true` pages explain what
 * the feature WILL be — Raya tells them what's coming.
 */

export interface PageGuide {
  /** Stable key used for the localStorage "seen" set (deep sub-pages share a parent key). */
  key: string;
  /** Path prefixes this guide covers. Matched as exact or `prefix + '/'`. */
  paths: string[];
  /** Short page/feature name shown as the welcome title. */
  title: string;
  /** Raya's one- or two-line, first-person summary of what this place is. */
  summary: string;
  /** A few concrete things the user can do here (kept to 3–4, short). */
  highlights: string[];
  /** Coming-soon feature — frames the copy as "what's coming". */
  soon?: boolean;
}

export const PAGE_GUIDES: PageGuide[] = [
  // ── Start here ────────────────────────────────────────────────────────────
  {
    key: 'dashboard',
    paths: ['/dashboard'],
    title: 'Your Dashboard',
    summary: "This is your home base — I keep your day in front of you the moment you arrive.",
    highlights: [
      'Your next prayer and full prayer times',
      'A daily ayah to reflect on',
      'Quick jumps into everything you use most',
    ],
  },
  {
    key: 'raya-hub',
    paths: ['/raya'],
    title: 'Raya Hub',
    summary: "This is where you bring me into your everyday life — link me to WhatsApp and your Google apps, and I work with the same memory there as here.",
    highlights: [
      'Link WhatsApp in one tap — no app needed',
      'Connect Calendar, Gmail, Meet & Drive',
      'See what I can do for you, with your privacy protected',
    ],
  },
  {
    key: 'whatsapp-link',
    paths: ['/settings/whatsapp'],
    title: 'Raya on WhatsApp',
    summary: "Link your WhatsApp here and you can reach me anytime, right from your chats.",
    highlights: [
      'One-tap, encrypted linking',
      'Same memory as the app',
      'Talk to me where you already are',
    ],
  },

  // ── Qur'an ─────────────────────────────────────────────────────────────────
  // More specific /quran/* prefixes must be listed; longest-prefix wins at match time.
  {
    key: 'quran-hifz',
    paths: ['/quran/hifz'],
    title: 'Hifz',
    summary: "Your memorization space — I adapt to where you are and help the words stay.",
    highlights: [
      'Adaptive memorize: beginner, intensive or revision',
      'Voice & visual tests that find your weak ayahs',
      'Hifz circles for group accountability',
    ],
  },
  {
    key: 'quran-recitation',
    paths: ['/quran/recitation'],
    title: 'Recitation',
    summary: "Listen to the Qur'an recited beautifully — over a hundred reciters, whenever you like.",
    highlights: [
      '100+ professional reciters',
      'Full-surah playback with a mini-player',
      'Seek, loop and keep listening as you read',
    ],
  },
  {
    key: 'quran-research',
    paths: ['/quran/research'],
    title: 'Topic Research',
    summary: "Explore a theme across the Qur'an, hadith and tafsir — I gather and ground the sources for you.",
    highlights: [
      'Search Qur’an, hadith & tafsir together',
      'Save findings into named collections',
      'Compose a study sheet from many sources',
    ],
  },
  {
    key: 'quran-tracks',
    paths: ['/quran/tracks'],
    title: 'Study Tracks',
    summary: "Scholar-curated journeys through classical knowledge — go step by step, at your pace.",
    highlights: [
      'Multi-stage tracks (Tawhid, Sabr and more)',
      'Progress saved as you complete each stage',
      'Every track cites its scholars and sources',
    ],
  },
  {
    key: 'quran-workspace',
    paths: ['/quran/workspace'],
    title: 'Workspace',
    summary: "Everything you've saved from the Qur'an, in one place — notes, reflections and bookmarks tied to the verses.",
    highlights: [
      'Notes, docs, bookmarks, annotations & reflections',
      'Attach anything to a specific ayah',
      'Filter by type and pick up where you left off',
    ],
  },
  {
    key: 'quran-mushaf',
    paths: ['/quran/mushaf'],
    title: 'Mushaf',
    summary: "The printed Mushaf, brought to life — read page by page just like the book in your hands.",
    highlights: [
      'Four scripts (Madinah, IndoPak, Uthmani…) + light/dark',
      'A 3D page-flip and quick jump to any page',
      'Verse-by-verse audio with loop',
    ],
  },
  {
    key: 'quran-guess-ayah',
    paths: ['/quran/guess-ayah'],
    title: 'Guess the Ayah',
    summary: "A quick game — I show you a verse, you name its surah. A light way to sharpen recognition.",
    highlights: [
      'Seven fast rounds, four choices each',
      'Instant reveal after every answer',
      'Your all-time best score is kept',
    ],
  },
  {
    key: 'quran-surah-deepdive',
    paths: ['/quran/surah'],
    title: 'Surah Deep-Dive',
    summary: "Go deeper into a surah — its context, its themes, and a way to test what you understood.",
    highlights: [
      'X-Ray: revelation context, themes & connected verses',
      'Depth FAQs: reflection prompts you can explore with me',
      'A short comprehension quiz with your best score',
    ],
  },
  {
    key: 'quran',
    paths: ['/quran'],
    title: 'Qur’an with Raya',
    summary: "This is your Qur'an space — wherever you want to read, listen, memorize or reflect, I'm right here with you.",
    highlights: [
      'Read, recite and follow the Mushaf',
      'Memorize with Hifz, or play Guess the Ayah',
      'Research themes and keep a personal workspace',
    ],
  },

  // ── Practice ─────────────────────────────────────────────────────────────
  {
    key: 'barakah-labs',
    paths: ['/barakah-labs', '/barka-labs'],
    title: 'Baraka',
    summary: "Your gratitude space — notice the small blessings, and watch shukr grow into something you can see.",
    highlights: [
      'A one-minute daily blessing to count',
      'Break a blessing down to see how much it holds',
      'A community feed, leaderboard and friendly challenges',
    ],
  },

  // ── Wealth / EIM ───────────────────────────────────────────────────
  {
    key: 'eim-library',
    paths: ['/eim/library'],
    title: 'EIM Library',
    summary: "Learn halal investing properly — a structured course plus the playbooks of the great investors, all through a halal lens.",
    highlights: [
      'Five levels from Foundations to Mastery',
      'Famous-investor playbooks with case studies',
      'Your progress tracked per level',
    ],
  },
  {
    key: 'eim-simulator',
    paths: ['/eim/simulator'],
    title: 'Portfolio Simulator',
    summary: "Build and test portfolios with real (delayed) prices — pure practice, never real money.",
    highlights: [
      'Create named practice portfolios',
      'Track your positions over time',
      'Experiment with zero risk',
    ],
  },
  {
    key: 'eim-mentor',
    paths: ['/eim/mentor'],
    title: 'EIM Mentor',
    summary: "I'll analyse your portfolio through whichever lens you choose — Shariah, conventional, or both side by side.",
    highlights: [
      'Pick a lens: Islamic Finance, Conventional or Compass',
      'Watch the analysis build live',
      'Get an at-a-glance read with the reasoning behind it',
    ],
  },
  {
    key: 'eim-candlesticks',
    paths: ['/eim/candlesticks'],
    title: 'Candlestick Library',
    summary: "Learn to read the charts — fifty-plus patterns, each explained step by step.",
    highlights: [
      'Filter by candle count and signal',
      'A clear illustration for every pattern',
      'A stepped lesson with cautions for each one',
    ],
  },
  {
    key: 'eim',
    paths: ['/eim'],
    title: 'EIM',
    summary: "Your wealth through the lens of balance — fully halal-screened. Learn, simulate, and get mentored on ethical investing.",
    highlights: [
      'A guided course on halal investing',
      'Simulators, scenario labs and projections',
      'An AI mentor, scholar FAQs and a pattern library',
    ],
  },
  {
    key: 'zakat',
    paths: ['/zakat'],
    title: 'Zakat Calculator',
    summary: "Work out your zakat with confidence — built to the AAOIFI standard, with live metal prices.",
    highlights: [
      'Nine asset categories with live spot prices',
      'Madhab toggle for jewellery, trading vs holding for stocks',
      'A clear, itemised breakdown of what’s due',
    ],
  },
  {
    key: 'wallet',
    paths: ['/wallet'],
    title: 'Your Wallet',
    summary: "Your DinarZ (DNZ) in one place — balance, history and the rewards you've earned.",
    highlights: [
      'Balance, daily earning cap and today’s earnings',
      'Your full transaction history',
      'Referral rewards and a live DNZ price chart',
    ],
  },
  {
    key: 'screener',
    paths: ['/screener'],
    title: 'Halal Stock Screener',
    summary: "Check whether a stock is Shariah-compliant before you invest.",
    highlights: [
      'Screen any ticker against Shariah criteria',
      'See the financial ratios behind the verdict',
      'Make informed, halal decisions',
    ],
  },

  // ── Souk ───────────────────────────────────────────────────────────────────
  {
    key: 'souk',
    paths: ['/souk'],
    title: 'Online Souk',
    summary: "A trusted marketplace — only verified, halal-checked vendors. Find what you need, or sell your own.",
    highlights: [
      'Browse by category, trending and fresh listings',
      'List something of your own in minutes',
      'Save items and manage your listings',
    ],
  },

  // ── Knowledge & community ───────────────────────────────────────────────────
  {
    key: 'research',
    paths: ['/research'],
    title: 'Research',
    summary: "A workspace for serious Islamic writing — draft, publish and discover peer-reviewed articles with proper citations.",
    highlights: [
      'Draft and publish your own articles',
      'Discover work published by the community',
      'Cite Qur’an and hadith as you write',
    ],
  },
  {
    key: 'connections',
    paths: ['/connections'],
    title: 'Connections',
    summary: "Find and keep good company — people matched to you, with the reason we matched made clear.",
    highlights: [
      'Discover people with “why we matched” reasons',
      'Send, receive and manage requests',
      'Message anyone you’re connected with',
    ],
  },
  {
    key: 'messages',
    paths: ['/messages'],
    title: 'Messages',
    summary: "Your direct conversations, all in one inbox.",
    highlights: [
      'Every conversation with a quick preview',
      'Unread markers so nothing slips by',
      'Tap any chat to continue it',
    ],
  },

  // ── Account & support ───────────────────────────────────────────────────────
  {
    key: 'profile',
    paths: ['/profile', '/user-overview'],
    title: 'Your Profile',
    summary: "Your identity here, and a look at your journey — streaks, achievements and what you've built.",
    highlights: [
      'Your Qur’an and login streaks, messages and referrals',
      'A month-in-review of your activity',
      'Account, security and data controls',
    ],
  },
  {
    key: 'settings',
    paths: ['/settings'],
    title: 'Settings',
    summary: "Make Zaryah+ yours — notifications, connected channels, security and more.",
    highlights: [
      'Browser, email and push notifications',
      'Connected channels like WhatsApp',
      'Security, motion and desktop preferences',
    ],
  },
  {
    key: 'help',
    paths: ['/help', '/support'],
    title: 'Help & Support',
    summary: "Stuck on something? This is where you find answers and reach us.",
    highlights: [
      'Browse common questions',
      'Reach support directly',
      'Get help with anything in the app',
    ],
  },
  {
    key: 'feedback',
    paths: ['/feedback'],
    title: 'Feedback',
    summary: "Tell us what would make Zaryah+ better — we read every word.",
    highlights: [
      'Share an idea or report something',
      'Help shape what we build next',
    ],
  },
  {
    key: 'about',
    paths: ['/about'],
    title: 'About Zaryah+',
    summary: "The story and intention behind Zaryah+ — why we built this, and for whom.",
    highlights: [
      'What Zaryah+ is here to do',
      'The principles behind it',
    ],
  },
  {
    key: 'notifications',
    paths: ['/notifications'],
    title: 'Notifications',
    summary: "Everything that needs your attention, gathered here.",
    highlights: [
      'Your latest alerts and updates',
      'Tap through to whatever needs you',
    ],
  },

  // ── On the horizon (coming soon) ────────────────────────────────────────────
  {
    key: 'matrimony',
    paths: ['/matrimony'],
    title: 'Sakinah',
    summary: "Sakinah is coming — a private, guardian-aware way to seek marriage, with dignity and safety first.",
    highlights: [
      'Serious, intention-led matchmaking',
      'Privacy and family involvement built in',
      'I’ll guide you gently when it opens',
    ],
    soon: true,
  },
  {
    key: 'islamic-banking',
    paths: ['/islamic-banking'],
    title: 'Islamic Banking',
    summary: "Coming soon — Shariah-compliant banking and finance products, screened and explained.",
    highlights: [
      'Halal accounts and products',
      'Clear, riba-free terms',
      'Guidance you can trust',
    ],
    soon: true,
  },
  {
    key: 'real-estate',
    paths: ['/real-estate'],
    title: 'Real Estate',
    summary: "Coming soon — a halal property marketplace for buying, renting and financing the right way.",
    highlights: [
      'Browse halal-financed property',
      'Riba-free purchase routes',
      'Verified listings',
    ],
    soon: true,
  },
  {
    key: 'shark-tank',
    paths: ['/shark-tank'],
    title: 'Looop',
    summary: "Looop is on the horizon — the community's launchpad for ventures, builders and ethical backers.",
    highlights: [
      'Pitch and discover ventures',
      'Connect founders with backers',
      'Build something for the ummah',
    ],
    soon: true,
  },
  {
    key: 'chamber',
    paths: ['/chamber'],
    title: 'Chamber',
    summary: "Coming soon — a space for business and professional community within Zaryah+.",
    highlights: [
      'Connect with professionals',
      'Grow your halal business',
    ],
    soon: true,
  },
  {
    key: 'commerce',
    paths: ['/commerce'],
    title: 'Commerce',
    summary: "Coming soon — tools to run and grow a halal business.",
    highlights: [
      'Manage your commerce in one place',
      'Halal-first by design',
    ],
    soon: true,
  },
  {
    key: 'halaqah',
    paths: ['/halaqah'],
    title: 'Halaqah',
    summary: "Coming soon — find and host study circles and gatherings near you.",
    highlights: [
      'Discover circles around you',
      'Host your own gathering',
      'Learn together, in person and online',
    ],
    soon: true,
  },
  {
    key: 'events',
    paths: ['/events'],
    title: 'Events',
    summary: "Coming soon — Islamic events and gatherings, all in one calendar.",
    highlights: [
      'Discover events near you',
      'Save and share what matters',
    ],
    soon: true,
  },
  {
    key: 'media',
    paths: ['/media'],
    title: 'Media',
    summary: "Coming soon — a library of beneficial Islamic content to watch and listen to.",
    highlights: [
      'Lectures, series and reminders',
      'Curated, beneficial content',
    ],
    soon: true,
  },
  {
    key: 'qibla',
    paths: ['/qibla'],
    title: 'Qibla Compass',
    summary: "Coming soon — find the direction of the Qibla wherever you are.",
    highlights: [
      'Accurate Qibla direction',
      'Works on the move',
    ],
    soon: true,
  },
  {
    key: 'calendar',
    paths: ['/calendar'],
    title: 'Hijri Calendar',
    summary: "Coming soon — the Islamic calendar, with the dates that matter.",
    highlights: [
      'Hijri dates at a glance',
      'Important days and months',
    ],
    soon: true,
  },
  {
    key: 'education',
    paths: ['/education'],
    title: 'Education',
    summary: "Coming soon — Islamic courses and tutoring to keep learning.",
    highlights: [
      'Structured courses',
      'Learn from qualified teachers',
    ],
    soon: true,
  },
  {
    key: 'faith',
    paths: ['/faith'],
    title: 'Faith',
    summary: "Coming soon — a hub for the essentials of practice, including a masjid finder.",
    highlights: [
      'Find masjids near you',
      'Tools for everyday practice',
    ],
    soon: true,
  },
  {
    key: 'digital-id',
    paths: ['/digital-id'],
    title: 'Digital ID',
    summary: "Coming soon — a trusted digital identity within Zaryah+.",
    highlights: [
      'A verified identity you control',
      'Used across Zaryah+ features',
    ],
    soon: true,
  },
  {
    key: 'ramadan-kids',
    paths: ['/ramadan-kids'],
    title: 'Ramadan for Kids',
    summary: "Coming soon — a joyful way for children to engage with Ramadan.",
    highlights: [
      'Activities and rewards for kids',
      'Build good habits early',
    ],
    soon: true,
  },
  {
    key: 'voice-companion',
    paths: ['/voice-companion'],
    title: 'Voice Companion',
    summary: "Coming soon — talk to me out loud, hands-free.",
    highlights: [
      'Speak naturally, I’ll respond',
      'Guidance without typing',
    ],
    soon: true,
  },
  {
    key: 'bait-ul-maal',
    paths: ['/bait-ul-maal'],
    title: 'Bait-ul-Maal',
    summary: "Coming soon — a transparent way to give and to support those in need.",
    highlights: [
      'Give with full transparency',
      'Support verified causes',
    ],
    soon: true,
  },
  {
    key: 'purification',
    paths: ['/purification'],
    title: 'Purification Calculator',
    summary: "Coming soon — work out the portion of investment income to purify.",
    highlights: [
      'Calculate impure income to give away',
      'Keep your wealth clean',
    ],
    soon: true,
  },
  {
    key: 'debt',
    paths: ['/debt'],
    title: 'Debt Restructuring',
    summary: "Coming soon — a halal path out of debt, planned with care.",
    highlights: [
      'A clear plan to clear what you owe',
      'Riba-free and sustainable',
    ],
    soon: true,
  },
  {
    key: 'tiswa',
    paths: ['/tiswa'],
    title: 'Tiswa',
    summary: "Coming soon — more is on the way here.",
    highlights: [
      'A new experience in the making',
    ],
    soon: true,
  },
  {
    key: 'halal-intimacy',
    paths: ['/halal-intimacy'],
    title: 'Halal Intimacy',
    summary: "Coming soon — private, respectful guidance for married life, rooted in the deen.",
    highlights: [
      'Knowledge with adab and discretion',
      'For married couples',
    ],
    soon: true,
  },
];

/** Shown on any page without a more specific guide — so coverage is total. */
export const GENERIC_GUIDE: PageGuide = {
  key: 'generic',
  paths: [],
  title: 'I’m here with you',
  summary: "Wherever you are in Zaryah+, I'm one tap away — tell me where you want to go and I'll take you straight there.",
  highlights: [
    'Ask me to open anything',
    'Or just tell me what you need',
  ],
};

function isPrefixMatch(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

/**
 * Resolve the best guide for a pathname using longest-prefix matching, so a
 * specific sub-page (e.g. /quran/hifz) wins over its parent (/quran). Falls
 * back to GENERIC_GUIDE so every route is covered.
 */
export function resolvePageGuide(pathname: string): PageGuide {
  let best: PageGuide | null = null;
  let bestLen = -1;
  for (const guide of PAGE_GUIDES) {
    for (const p of guide.paths) {
      if (isPrefixMatch(pathname, p) && p.length > bestLen) {
        best = guide;
        bestLen = p.length;
      }
    }
  }
  return best ?? GENERIC_GUIDE;
}
