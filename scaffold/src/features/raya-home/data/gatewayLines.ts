/**
 * gatewayLines.ts — Raya's agentic "taking you there" lines, keyed by route.
 *
 * The whole point: Raya should feel like a companion walking you into the app,
 * not a silent redirect. "Let's calculate your zakat — opening your Zakat
 * Calculator ✦" reads as an agent guiding you, even though it's just a hook.
 *
 * Covers the gateway features plus the common matcher destinations. Anything
 * not listed falls back to a warm generic line using the page label.
 */

const ROUTE_LINES: Record<string, string> = {
  // Gateway features
  '/barakah-labs': "Let's notice a blessing together — opening Baraka for you. ✦",
  '/quran': "Let's open the Qur'an and sit with it together. ✦",
  '/eim': "Let's look at your wealth in balance — opening EIM. ✦",
  '/souk': "Opening the Souk — let's find something you can trust. ✦",
  '/matrimony': "Let's begin this gently — opening Sakinah, where it stays private. ✦",
  '/halaqah': "Let's find your circle — opening Halaqah. ✦",
  '/shark-tank': "Taking you to ventures — Looop. ✦",

  // Common matcher destinations
  '/dashboard': "Opening your dashboard — here's everything at a glance. ✦",
  '/zakat': "Let's calculate your zakat — opening your Zakat Calculator. ✦",
  '/purification': "Let's purify that income — opening the Purification Calculator. ✦",
  '/prayer-times': "Here are your prayer times — taking you there now. ✦",
  '/qibla': "Let's find the qibla for you. ✦",
  '/wallet': "Let's check your wallet. ✦",
  '/screener': "Let's screen that the halal way — opening the Shariah Screener. ✦",
  '/quran/read': "Let's read together — opening the Qur'an. ✦",
  '/quran/hifz': "Let's strengthen your hifz — opening your memorization space. ✦",
  '/ai-assistant': "I'm right here — let's talk. ✦",
  '/connections': "Let's see your people — opening Connections. ✦",
  '/messages': "Opening your messages. ✦",
  '/research': "Let's dig into the sources — opening Research. ✦",
  '/calendar': "Opening the Hijri calendar for you. ✦",
  '/faith/masjid-finder': "Let's find a masjid near you. ✦",
};

/** A personalized "taking you there" line for a destination. */
export function takingYouLine(route: string, label?: string): string {
  return ROUTE_LINES[route] ?? `Taking you to ${label ?? 'it'} now. ✦`;
}
