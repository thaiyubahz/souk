/**
 * normalize.ts — deterministic text normalization for the Raya nav-agent.
 *
 * Zero dependencies, no LLM. Everything here is pure and synchronous so the
 * intent matcher can run instantly on every keystroke-submit.
 */

/** Words that carry no routing signal — stripped before matching. */
export const FILLER_WORDS = new Set<string>([
  // articles / pronouns / prepositions
  'the', 'a', 'an', 'my', 'me', 'i', 'we', 'us', 'our', 'your', 'you',
  'to', 'into', 'in', 'on', 'of', 'for', 'at', 'with', 'and', 'or',
  'please', 'pls', 'kindly', 'just', 'now', 'some', 'any', 'this', 'that',
  // command / nav verbs (the verb itself is not a route signal)
  'go', 'goto', 'open', 'show', 'take', 'bring', 'launch', 'jump', 'head',
  'navigate', 'lets', 'let', 'want', 'wanna', 'gimme', 'give', 'get',
  'see', 'view', 'visit', 'find', 'load',
]);

/** Nav verbs/phrases that signal an explicit navigation command. */
export const NAV_VERB_PHRASES: readonly string[] = [
  'take me to', 'bring me to', 'let me go to', "let's go to", 'lets go to',
  'go to', 'goto', 'jump to', 'head to', 'navigate to', 'navigate',
  'show me the', 'show me', 'show', 'open up', 'open', 'launch', 'go',
  'take me', 'i want to go to', 'i want to open', 'i wanna open',
];

/** Question cues — if present, NEVER auto-navigate (answer instead). */
export const QUESTION_CUES: readonly string[] = [
  'what', 'whats', "what's", 'why', 'how', 'who', 'whom', 'whose',
  'when', 'where', 'which', 'explain', 'define', 'definition',
  'should i', 'can i', 'could i', 'do i', 'is it', 'is this', 'are ',
  'tell me about', 'meaning of', 'difference between', 'help me understand',
];

/** Synonym → canonical token expansion. Values are appended (not replaced). */
const SYNONYMS: Record<string, string[]> = {
  marketplace: ['souk', 'shop', 'store', 'market'],
  market: ['souk'],
  shop: ['souk'],
  store: ['souk'],
  buy: ['souk'],
  sell: ['souk', 'listing'],
  prayer: ['salah', 'prayertimes'],
  prayers: ['salah', 'prayer'],
  salah: ['prayer'],
  namaz: ['prayer', 'salah'],
  stock: ['screener', 'shariah'],
  stocks: ['screener'],
  share: ['screener', 'stock'],
  shares: ['screener', 'stock'],
  invest: ['eim', 'screener'],
  investing: ['eim'],
  investment: ['eim'],
  portfolio: ['eim'],
  wealth: ['eim'],
  money: ['eim', 'wallet'],
  finance: ['eim', 'banking'],
  financial: ['eim'],
  charity: ['zakat', 'baitulmaal', 'sadaqah'],
  sadaqah: ['baitulmaal'],
  donate: ['baitulmaal', 'zakat'],
  donation: ['baitulmaal'],
  marriage: ['matrimony', 'sakinah', 'nikah'],
  marry: ['matrimony'],
  spouse: ['matrimony'],
  nikah: ['matrimony'],
  rishta: ['matrimony'],
  sakinah: ['matrimony'],
  circle: ['halaqah'],
  circles: ['halaqah'],
  gathering: ['halaqah', 'events'],
  community: ['halaqah', 'connections'],
  baraka: ['barakah'],
  gratitude: ['barakah'],
  shukr: ['barakah'],
  quran: ['quran', 'recitation'],
  recite: ['recitation', 'quran'],
  recitation: ['quran'],
  memorize: ['hifz'],
  memorise: ['hifz'],
  memorization: ['hifz'],
  hifz: ['memorize'],
  tafsir: ['quran', 'research'],
  ponder: ['tadabbur', 'quran'],
  wallet: ['wallet', 'dnz'],
  dnz: ['wallet'],
  balance: ['wallet'],
  compass: ['qibla'],
  qibla: ['compass'],
  chat: ['assistant', 'raya'],
  assistant: ['raya'],
  messages: ['conversations', 'dm'],
  message: ['conversations'],
  dm: ['messages'],
  dms: ['messages'],
  contacts: ['connections'],
  network: ['connections'],
  networking: ['connections'],
  settings: ['settings', 'preferences'],
  preferences: ['settings'],
  account: ['settings', 'profile'],
  notification: ['notifications'],
  calendar: ['hijri', 'calendar'],
  kids: ['ramadan'],
  ventures: ['sharktank', 'chamber'],
  startup: ['sharktank'],
  investors: ['sharktank'],
};

/** Lowercase, strip diacritics + punctuation, collapse whitespace. */
export function clean(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[‘’'`]/g, '') // drop apostrophes (qur'an -> quran)
    .replace(/[^a-z0-9\s]/g, ' ')     // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim();
}

/** clean() then split, dropping filler/stop words. */
export function tokenize(input: string): string[] {
  const c = clean(input);
  if (!c) return [];
  return c.split(' ').filter((t) => t.length > 0 && !FILLER_WORDS.has(t));
}

/** Classic Levenshtein edit distance (iterative, two-row). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ac = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ac === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Token equality tolerant of a single-character typo on longer words.
 * Short tokens (<5 chars) must match exactly to avoid false positives
 * (e.g. "hifz" vs "hajj").
 */
export function fuzzyTokenEq(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  return levenshtein(a, b) <= 1;
}

/**
 * Expand a token list with canonical synonyms. The original tokens are kept;
 * synonyms are appended and de-duplicated.
 */
export function expandSynonyms(tokens: string[]): string[] {
  const out = new Set<string>(tokens);
  for (const t of tokens) {
    const syns = SYNONYMS[t];
    if (syns) for (const s of syns) out.add(s);
  }
  return [...out];
}

/** tokenize + expandSynonyms in one call — the canonical token set. */
export function canonicalTokens(input: string): string[] {
  return expandSynonyms(tokenize(input));
}

/** Does the raw input contain a question cue? (case/space tolerant) */
export function hasQuestionCue(input: string): boolean {
  const lc = ' ' + input.toLowerCase().trim() + ' ';
  if (input.includes('?')) return true;
  return QUESTION_CUES.some((cue) => {
    // Multi-word cues: substring match. Single-word cues: word-boundary match.
    if (cue.includes(' ')) return lc.includes(' ' + cue.trim() + ' ') || lc.includes(' ' + cue.trim());
    return lc.includes(' ' + cue + ' ');
  });
}

/**
 * If the input begins with a nav verb/phrase, return the remainder (the part
 * that names a destination). Returns null when no leading nav verb is present.
 */
export function stripNavVerb(input: string): string | null {
  const c = clean(input);
  // Longest phrases first so "take me to" wins over "take".
  const sorted = [...NAV_VERB_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const p = clean(phrase);
    if (c === p) return ''; // bare verb, no destination
    if (c.startsWith(p + ' ')) return c.slice(p.length + 1).trim();
  }
  return null;
}
