/* =========================================================================
   Narrative safety.
   All generated language passes through these helpers: no guarantees, no
   fabricated certainty, no fabricated chain-of-thought.
   ========================================================================= */

export const BANNED_PHRASES: string[] = [
  'guaranteed',
  'guarantee',
  'risk-free',
  'risk free',
  'assured',
  'will happen',
  'certain to',
  'definitely will',
  'will definitely',
  'sure shot',
  'sure-shot',
  'cannot lose',
  'no risk',
  'always wins',
  'promise',
  'certainty',
  'bulletproof',
  '100% accurate',
  'will rise',
  'will fall',
  'will hit',
  'expect it to hit',
]

/** Returns the first banned phrase found in `text`, or null. */
export function findBannedPhrase(text: string): string | null {
  const lower = text.toLowerCase()
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) return phrase
  }
  return null
}

export function isSafeLanguage(text: string): boolean {
  return findBannedPhrase(text) === null
}

/** Throws in development/test if generated copy violates the safe-language rules. */
export function assertSafeLanguage(text: string, context: string): void {
  const found = findBannedPhrase(text)
  if (found) {
    throw new Error(`Unsafe language "${found}" in ${context}: "${text}"`)
  }
}

export const SAFE_FRAMINGS = {
  scenario: 'Scenario',
  observed: 'Observed',
  ifPatternHolds: 'If the current pattern persists',
  wouldLike: 'would be consistent with',
  notYet: 'not yet confirmed',
} as const

/** "bullish" → "upside-leaning" phrasing that avoids prediction-as-fact. */
export function directionPhrase(direction: 'bullish' | 'bearish' | 'neutral'): string {
  if (direction === 'bullish') return 'upside-leaning'
  if (direction === 'bearish') return 'downside-leaning'
  return 'two-sided'
}
