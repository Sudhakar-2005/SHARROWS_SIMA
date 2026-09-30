/**
 * Typed mirrors of the motion/layout tokens defined in styles/tokens.css.
 * Use these for JS-driven animation and layout math.
 */

export const MOTION = {
  micro: 140,
  standard: 260,
  intelligence: 600,
  cinematic: 1100,
} as const

export const EASE = {
  premium: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
}

export const LAYOUT = {
  headerHeight: 56,
  sidebarWidth: 236,
  sidebarCollapsed: 64,
  railWidth: 320,
} as const

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/** Intelligence-loop states surfaced across the whole product. */
export const AI_STATES = [
  'idle',
  'observing',
  'analyzing',
  'thinking',
  'evaluating',
  'learning',
  'alert',
  'ready',
] as const

export type AIState = (typeof AI_STATES)[number]
