/**
 * Navigation Types
 * Defines sidebar, bottom nav, top nav, and drawer item structures
 * Matches Flutter's navigation_home.dart 6-section drawer structure
 */

export interface NavItemConfig {
  id: string;
  label: string;
  icon: string;
  path: string;
  /** Only visible when user is authenticated */
  protected?: boolean;
  /** Only visible to admin users */
  adminOnly?: boolean;
  /** Premium badge label (e.g., "AI", "PRO") */
  badge?: string;
  /** One-line description shown under the label in the Universe-style drawer. */
  description?: string;
  /** Arabic name shown beside the label in the drawer. */
  ar?: string;
}

export interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

/** Top navigation pill tabs — mirrors Flutter's horizontal tab bar */
export const TOP_NAV_TABS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: 'Home', path: '/' },
  { id: 'ai', label: 'Raya', icon: 'Sparkles', path: '/ai-assistant', badge: 'AI' },
  { id: 'quran', label: 'Quran Reading', icon: 'BookOpen', path: '/quran' },
  // Hidden from top bar per request — entries preserved for easy restore:
  // { id: 'connections', label: 'Connections', icon: 'Users', path: '/connections' },
  // { id: 'wallet', label: 'Wallet', icon: 'CreditCard', path: '/wallet' },
  { id: 'barka-labs', label: 'Barakah Labs', icon: 'Sparkle', path: '/barakah-labs' },
];

/** Bottom navigation tabs (mobile) — 4 core tabs.
 *  One shared dock used on every mobile route (home + raya + quran + barakah).
 *  Replaces the previous per-feature docks (HomeReferenceDock, barakah-labs Dock). */
export const BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: 'Home', path: '/' },
  { id: 'ai', label: 'Raya', icon: 'Sparkles', path: '/ai-assistant', badge: 'AI' },
  { id: 'quran', label: 'Quran', icon: 'BookOpen', path: '/quran' },
  { id: 'barakah', label: 'Barakah', icon: 'Flask', path: '/barakah-labs' },
];

/**
 * Sidebar sections — matches Flutter's 6-section drawer menu
 * Flutter source: navigation_home.dart _buildDrawerContent()
 */
export const SIDEBAR_SECTIONS: NavSectionConfig[] = [
  {
    title: 'Finance',
    items: [
      { id: 'home', label: 'Home', icon: 'Home', path: '/', description: 'Your dashboard' },
      { id: 'wallet', label: 'Wallet', icon: 'CreditCard', path: '/wallet', description: 'DNZ balance & rewards', ar: 'محفظة' },
      { id: 'screener', label: 'Screener', icon: 'BarChart3', path: '/screener', description: 'Shariah stock screening' },
      { id: 'zakat', label: 'Zakat', icon: 'Calculator', path: '/zakat', description: 'Calculate & give zakat', ar: 'زكاة' },
      { id: 'eim', label: 'EIM', icon: 'Sparkles', path: '/eim', badge: 'NEW', description: 'Halal wealth mentor' },
      // Halal Trading (EIM v2, T1) — built but DEFERRED (2026-06-04). Launcher
      // tile hidden so users don't hit the read-only mock; routes/code remain at
      // /features/trading and `/trading` for when trading work resumes.
      // { id: 'halal-trading', label: 'Trading', icon: 'TrendingUp', path: '/trading', badge: 'NEW', description: 'Shariah trading terminal' },
      { id: 'debt', label: 'Debt', icon: 'Wallet', path: '/debt', badge: 'SOON', description: 'Debt restructuring' },
      { id: 'islamic-banking', label: 'Bank', icon: 'Landmark', path: '/islamic-banking', badge: 'SOON', description: 'Halal banking' },
      { id: 'bait-ul-maal', label: 'Bait Maal', icon: 'HandCoins', path: '/bait-ul-maal', badge: 'SOON', description: 'Community charity fund', ar: 'بيت المال' },
      { id: 'chamber', label: 'Chamber', icon: 'Briefcase', path: '/chamber', badge: 'SOON', description: 'Business chamber' },
      { id: 'shark-tank', label: 'Investors', icon: 'Lightbulb', path: '/shark-tank', badge: 'SOON', description: 'Ventures & investors' },
    ],
  },
  {
    title: 'Islamic',
    items: [
      { id: 'quran', label: 'Qur’an', icon: 'BookOpen', path: '/quran', description: 'Read & reflect', ar: 'القرآن' },
      { id: 'prayer', label: 'Prayer', icon: 'Clock', path: '/prayer-times', description: 'Times & reminders', ar: 'صلاة' },
      { id: 'faith', label: 'Faith', icon: 'Heart', path: '/faith', badge: 'SOON', description: 'Deen essentials', ar: 'إيمان' },
      { id: 'media', label: 'Media', icon: 'Library', path: '/media', badge: 'SOON', description: 'Talks & videos' },
      { id: 'education', label: 'Education', icon: 'GraduationCap', path: '/education', badge: 'SOON', description: 'Courses & learning' },
      { id: 'barka-labs', label: 'Baraka', icon: 'Flask', path: '/barakah-labs', description: 'Gratitude & reflection', ar: 'بركة' },
      { id: 'research', label: 'Research', icon: 'FileCheck', path: '/research', description: 'Articles & scholars', ar: 'بحث' },
      { id: 'ramadan-kids', label: 'Ramadan', icon: 'Star', path: '/ramadan-kids', badge: 'SOON', description: 'Ramadan for children' },
    ],
  },
  {
    title: 'Community',
    items: [
      { id: 'connections', label: 'Connections', icon: 'UserPlus', path: '/connections', description: 'Your network' },
      { id: 'messages', label: 'Messages', icon: 'ChatCircleDots', path: '/messages', description: 'Private chats' },
      { id: 'halaqah', label: 'Halaqah', icon: 'UsersRound', path: '/halaqah', badge: 'SOON', description: 'Circles & gatherings', ar: 'حلقة' },
      { id: 'matrimony', label: 'Sakinah', icon: 'HeartHandshake', path: '/matrimony', badge: 'SOON', description: 'Marriage, with dignity', ar: 'سكينة' },
      { id: 'halal-intimacy', label: 'Intimacy', icon: 'HeartPulse', path: '/halal-intimacy', badge: 'SOON', description: 'Guidance for couples' },
      { id: 'events', label: 'Events', icon: 'CalendarDays', path: '/events', badge: 'SOON', description: 'What’s happening' },
    ],
  },
  {
    title: 'Services',
    items: [
      { id: 'souk', label: 'Souk', icon: 'Store', path: '/souk', description: 'Trusted marketplace', ar: 'سوق' },
      { id: 'commerce', label: 'Commerce', icon: 'Store', path: '/commerce', badge: 'SOON', description: 'Business tools' },
      { id: 'real-estate', label: 'Property', icon: 'Building', path: '/real-estate', badge: 'SOON', description: 'Halal property' },
      { id: 'digital-id', label: 'Digital ID', icon: 'IdCard', path: '/digital-id', badge: 'SOON', description: 'Your verified identity' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'ai', label: 'Raya', icon: 'Sparkles', path: '/ai-assistant', badge: 'AI', description: 'Your companion', ar: 'رايا' },
      { id: 'raya-agent', label: 'Raya on WA', icon: 'WhatsappLogo', path: '/raya', description: 'Chat on WhatsApp' },
      { id: 'voice', label: 'Voice', icon: 'Mic', path: '/voice-companion', badge: 'SOON', description: 'Talk to Raya' },
      { id: 'halaqah-admin', label: 'Circles', icon: 'ShieldCheck', path: '/halaqah-admin', description: 'Manage circles' },
      { id: 'tiswa', label: 'TISWA', icon: 'School', path: '/tiswa', badge: 'SOON', description: 'Islamic school' },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: 'User', path: '/profile', description: 'Your profile' },
      { id: 'notifications', label: 'Alerts', icon: 'Bell', path: '/notifications', description: 'Alerts & updates' },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings', description: 'Preferences' },
      { id: 'support', label: 'Support', icon: 'LifeBuoy', path: '/support', description: 'Get help' },
      { id: 'help', label: 'Help', icon: 'HelpCircle', path: '/help', description: 'FAQs & guides' },
      { id: 'feedback', label: 'Feedback', icon: 'Lightbulb', path: '/feedback', description: 'Share your thoughts' },
      { id: 'about', label: 'About', icon: 'HelpCircle', path: '/about', description: 'About Zaryah+' },
    ],
  },
];
