import type { Conviction, MarketRegime, Signal, SignalDirection } from './types'

/* =========================================================================
   Conviction: aggregates signal families into one calibrated score.
   Never exceeds 100, never claims certainty — mixed evidence lowers score.
   ========================================================================= */

export const KIND_WEIGHT: Record<Signal['kind'], number> = {
  technical: 0.27,
  fundamental: 0.21,
  news: 0.17,
  context: 0.3,
  sentiment: 0.05,
}

const NEUTRAL_BAND = 0.05

function directionSign(d: SignalDirection): number {
  return d === 'bullish' ? 1 : d === 'bearish' ? -1 : 0
}

/**
 * Quality of a single signal: strength scaled by how much the engine trusts
 * it. A perfect signal scores 1; typical solid signals land 0.4–0.7.
 */
function quality(s: Signal): number {
  return clamp01(s.strength) * (0.5 + s.confidence / 200)
}

export function computeConviction(opts: {
  signals: Signal[]
  regime: MarketRegime
  /** Calibration hit-rate for comparable score buckets, when known. */
  historicalHitRate?: number
  now: number
}): Conviction {
  const { signals, regime, historicalHitRate, now } = opts

  if (signals.length === 0) {
    return {
      score: 0,
      direction: 'neutral',
      regime,
      contributing: [],
      counterSignals: [],
      historicalHitRate,
      computedAt: now,
      provenance: 'derived',
    }
  }

  // Neutral-direction signals are readings of "no information" — they neither
  // support nor oppose, so they sit outside the scoring arithmetic.
  const directional = signals.filter((s) => directionSign(s.direction) !== 0)
  const weightOf = (s: Signal) => KIND_WEIGHT[s.kind] ?? 0.2

  let aligned = 0
  let capacity = 0
  let weightSum = 0
  for (const s of directional) {
    const contribution = weightOf(s) * quality(s)
    aligned += contribution * directionSign(s.direction)
    capacity += contribution
    weightSum += weightOf(s)
  }

  if (capacity === 0 || weightSum === 0) {
    return {
      score: 0,
      direction: 'neutral',
      regime,
      contributing: [],
      counterSignals: directional,
      historicalHitRate,
      computedAt: now,
      provenance: 'derived',
    }
  }

  // Agreement: how one-sided the directional evidence is (0–1).
  const agreement = Math.abs(aligned) / capacity
  // Strength: how good the directional evidence is per unit of attention (0–1).
  const meanQuality = capacity / weightSum
  const score = Math.max(
    0,
    Math.min(100, Math.round(100 * agreement * (0.5 + 0.5 * meanQuality))),
  )

  const direction: SignalDirection =
    agreement < NEUTRAL_BAND ? 'neutral' : aligned > 0 ? 'bullish' : 'bearish'
  const dirSign = directionSign(direction)

  const rank = (a: Signal, b: Signal) => weightOf(b) * quality(b) - weightOf(a) * quality(a)

  const contributing =
    dirSign === 0
      ? []
      : directional.filter((s) => directionSign(s.direction) === dirSign).sort(rank)

  // Against a direction: opposing signals. With no direction: every piece of
  // directional evidence that failed to resolve — shown as tension, not support.
  const counterSignals =
    dirSign === 0
      ? [...directional].sort(rank)
      : directional.filter((s) => directionSign(s.direction) === -dirSign).sort(rank)

  return {
    score,
    direction,
    regime,
    contributing,
    counterSignals,
    historicalHitRate,
    computedAt: now,
    provenance: 'derived',
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Which score bucket a prediction belongs to — used for calibration. */
export function scoreBucket(score: number): string {
  if (score >= 75) return 'high-conviction'
  if (score >= 55) return 'elevated-conviction'
  if (score >= 35) return 'moderate-conviction'
  return 'low-conviction'
}
