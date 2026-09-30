/** Pure settings helpers. */

export const MOTION_OPTIONS = [
  { key: 'system', label: 'Follow system' },
  { key: 'reduced', label: 'Reduced' },
  { key: 'full', label: 'Full' },
] as const

export type MotionKey = (typeof MOTION_OPTIONS)[number]['key']

/** Store preference (null = system, true = reduced, false = full) → segmented key. */
export function motionKeyFrom(pref: boolean | null): MotionKey {
  return pref === null ? 'system' : pref ? 'reduced' : 'full'
}

/** Segmented key → store preference. */
export function prefFromMotionKey(key: MotionKey): boolean | null {
  return key === 'system' ? null : key === 'reduced'
}
