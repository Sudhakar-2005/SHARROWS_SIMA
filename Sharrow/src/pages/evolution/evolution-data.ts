import { scoreBucket } from '@/engine/conviction'
import type { IntelligenceVersion, LearningEvent, LearningStatus, Prediction } from '@/engine/types'
import { cn } from '@/lib/cn'
import { matchRate, outcomeCounts } from '../predictions/predictions-data'

/** Pure helpers for the evolution screen. */

export const VERSION_STATUS_VARIANT: Record<
  IntelligenceVersion['status'],
  'pos' | 'warn' | 'flow'
> = {
  deployed: 'pos',
  validating: 'warn',
  proposed: 'flow',
}

export const VERSION_STATUS_LABEL: Record<IntelligenceVersion['status'], string> = {
  deployed: 'Deployed',
  validating: 'Validating',
  proposed: 'Proposed',
}

export const LEARNING_STATUS_VARIANT: Record<LearningStatus, 'accent' | 'pos' | 'warn' | 'flow'> =
  {
    detected: 'flow',
    validated: 'accent',
    proposed: 'warn',
    deployed: 'pos',
  }

export const LEARNING_KIND_LABEL: Record<LearningEvent['kind'], string> = {
  pattern: 'Pattern',
  calibration: 'Calibration',
  'signal-performance': 'Signal performance',
  'regime-behavior': 'Regime behavior',
}

/** Newest first. */
export function versionTimeline(versions: IntelligenceVersion[]): IntelligenceVersion[] {
  return [...versions].sort((a, b) => b.releasedAt - a.releasedAt)
}

/** Newest first. */
export function learningTimeline(learnings: LearningEvent[]): LearningEvent[] {
  return [...learnings].sort((a, b) => b.detectedAt - a.detectedAt)
}

export interface LearningStats {
  total: number
  detected: number
  validated: number
  proposed: number
  deployed: number
}

export function learningStats(learnings: LearningEvent[]): LearningStats {
  const stats: LearningStats = { total: learnings.length, detected: 0, validated: 0, proposed: 0, deployed: 0 }
  for (const l of learnings) stats[l.status] += 1
  return stats
}

const BAND_ORDER: Record<string, number> = {
  'high-conviction': 0,
  'elevated-conviction': 1,
  'moderate-conviction': 2,
  'low-conviction': 3,
}

export interface CalibrationBand {
  band: string
  label: string
  samples: number
  matched: number
  hitRate: number | null
}

/** Observed hit rate per confidence band — matched ÷ samples in that band. */
export function calibrationBands(predictions: Prediction[]): CalibrationBand[] {
  const groups = new Map<string, { total: number; matched: number }>()
  for (const p of predictions) {
    if (!p.evaluation) continue
    const band = p.outcome === 'inconclusive' ? null : scoreBucket(p.confidence)
    if (!band) continue
    const g = groups.get(band) ?? { total: 0, matched: 0 }
    g.total += 1
    if (p.evaluation.verdict === 'matched') g.matched += 1
    groups.set(band, g)
  }
  return [...groups.entries()]
    .map(([band, g]) => ({
      band,
      label: `${band.charAt(0).toUpperCase()}${band.slice(1)}`,
      samples: g.total,
      matched: g.matched,
      hitRate: g.total > 0 ? Math.round((g.matched / g.total) * 100) : null,
    }))
    .sort((a, b) => (BAND_ORDER[a.band] ?? 9) - (BAND_ORDER[b.band] ?? 9))
}

/** Bar tone for a band's observed hit rate. */
export function hitTone(hitRate: number | null): 'accent' | 'pos' | 'warn' | 'neg' {
  if (hitRate === null) return 'accent'
  return hitRate >= 60 ? 'pos' : hitRate >= 40 ? 'warn' : 'neg'
}

/** Text tone for a band's observed hit rate. */
export function hitTextTone(hitRate: number | null): string {
  if (hitRate === null) return 'num text-ink-2'
  return cn('num', hitRate >= 60 ? 'text-pos' : hitRate >= 40 ? 'text-warn' : 'text-neg')
}

/** Strict overall accuracy — matched ÷ conclusive, exposed for the strip. */
export function overallAccuracy(predictions: Prediction[]): {
  pct: number
  matched: number
  sample: number
} | null {
  return matchRate(outcomeCounts(predictions))
}

/** Static, safe narrative for the rail — what evolution means here. */
export const EVOLUTION_NARRATIVE = {
  headline:
    'SHARROW treats every resolved scenario as a measurement, not a moment — evaluations become learnings, and validated learnings become version changes.',
  points: [
    'Each evaluated scenario is scored against what actually happened, with the gap recorded in the ledger.',
    'Patterns across evaluations surface as learnings — detected first, validated once the sample is deep enough.',
    'A version change states its reason, its validation sample and its performance cost before it is marked deployed.',
    'Nothing here is a claim about live market outcomes — the sample is simulated and labeled throughout.',
  ],
} as const
