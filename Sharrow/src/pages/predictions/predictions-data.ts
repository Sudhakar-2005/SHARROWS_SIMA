import type { Prediction, PredictionOutcome } from '@/engine/types'
import { cn } from '@/lib/cn'

/** Pure helpers for the predictions screen. */

/** Tone for a percentage-point gap — magnitude of the miss, not its sign. */
export function gapTone(gap: number): string {
  const size = Math.abs(gap)
  return cn(
    'num whitespace-nowrap',
    size === 0 ? 'text-flow' : size <= 1.5 ? 'text-pos' : size <= 4 ? 'text-warn' : 'text-neg',
  )
}

export interface OutcomeCounts {
  matched: number
  partial: number
  missed: number
  inconclusive: number
  total: number
}

export function outcomeCounts(predictions: Prediction[]): OutcomeCounts {
  const counts: OutcomeCounts = { matched: 0, partial: 0, missed: 0, inconclusive: 0, total: 0 }
  for (const p of predictions) {
    const verdict = p.evaluation?.verdict
    if (!verdict) continue
    counts[verdict] += 1
    counts.total += 1
  }
  return counts
}

/** Strict match rate: matched ÷ conclusive outcomes (inconclusive excluded). */
export function matchRate(counts: OutcomeCounts): { pct: number; matched: number; sample: number } | null {
  const sample = counts.total - counts.inconclusive
  if (sample <= 0) return null
  return { pct: Math.round((counts.matched / sample) * 100), matched: counts.matched, sample }
}

export function activePredictions(predictions: Prediction[]): Prediction[] {
  return predictions
    .filter((p) => (p.status === 'active' || p.status === 'created') && !p.evaluation)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function evaluatedPredictions(predictions: Prediction[]): Prediction[] {
  return predictions
    .filter((p) => p.evaluation)
    .sort((a, b) => (b.evaluation?.at ?? 0) - (a.evaluation?.at ?? 0))
}

/** Gap between actual and expected move in percentage points (signed). */
export function outcomeGap(p: Prediction): number | null {
  if (p.actualMovePct === undefined || p.expectedMovePct === undefined) return null
  return Number((p.actualMovePct - p.expectedMovePct).toFixed(2))
}

export const OUTCOME_ORDER: PredictionOutcome[] = ['matched', 'partial', 'missed', 'inconclusive']
