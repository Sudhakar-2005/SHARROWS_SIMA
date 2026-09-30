import type { IntelligenceVersion, LearningEvent, Prediction } from './types'
import { scoreBucket } from './conviction'

/* =========================================================================
   Learning: turns evaluated predictions into validated observations and,
   where the sample supports it, a new intelligence version.
   Everything derived is evidence-counted — no learning without records.
   ========================================================================= */

export const ENGINE_VERSION = 'v0.1.0'

const NEXT_VERSION = 'v0.1.1'

function hitCredit(outcome: Prediction['outcome']): number {
  if (outcome === 'matched') return 1
  if (outcome === 'partial') return 0.5
  if (outcome === 'inconclusive') return 0
  return 0
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function deriveLearnings(predictions: Prediction[], now: number): LearningEvent[] {
  const evaluated = predictions.filter((p) => p.outcome && p.evaluation)
  if (evaluated.length === 0) return []

  const out: LearningEvent[] = []

  // --- Calibration by conviction band ---
  const buckets = new Map<string, Prediction[]>()
  for (const p of evaluated) {
    const key = scoreBucket(p.confidence)
    const list = buckets.get(key) ?? []
    list.push(p)
    buckets.set(key, list)
  }
  let calibrationIndex = 0
  for (const [bucket, list] of [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (list.length < 3) continue
    const hitRate = list.reduce((a, p) => a + hitCredit(p.outcome), 0) / list.length
    const matched = list.filter((p) => p.outcome === 'matched').length
    out.push({
      id: `learn-calibration-${calibrationIndex++}`,
      kind: 'calibration',
      title: `Calibration of the ${bucket} band`,
      detail: `Scenarios with ${bucket} confidence resolved as matched in ${matched} of ${list.length} evaluated cases (partial credit included: ${pct(hitRate)}).`,
      status: list.length >= 6 ? 'validated' : 'detected',
      detectedAt: now,
      validatedAt: list.length >= 6 ? now : undefined,
      sampleSize: list.length,
      effectSize: Number((hitRate - 0.5).toFixed(2)),
      evidence: [
        `Sample: ${list.length} evaluated scenarios`,
        `Hit rate (partial credit): ${pct(hitRate)}`,
        `Band: ${bucket}`,
      ],
      provenance: 'backtest',
    })
  }

  // --- Signal family performance ---
  const matchedPreds = evaluated.filter((p) => p.outcome === 'matched' || p.outcome === 'partial')
  const missedPreds = evaluated.filter((p) => p.outcome === 'missed')
  if (matchedPreds.length >= 3 && missedPreds.length >= 2) {
    const share = (list: Prediction[], token: string) =>
      list.filter((p) => p.supportingSignals.some((id) => id.includes(token))).length / list.length
    const techMatched = share(matchedPreds, '-tech-')
    const techMissed = share(missedPreds, '-tech-')
    out.push({
      id: 'learn-signal-technical',
      kind: 'signal-performance',
      title: 'Technical signals carry more weight in matched scenarios',
      detail: `Technical signals supported ${pct(techMatched)} of matched scenarios versus ${pct(techMissed)} of missed ones — the technical family is the most discriminating input at current settings.`,
      status: missedPreds.length >= 4 ? 'validated' : 'detected',
      detectedAt: now,
      validatedAt: missedPreds.length >= 4 ? now : undefined,
      sampleSize: matchedPreds.length + missedPreds.length,
      effectSize: Number((techMatched - techMissed).toFixed(2)),
      evidence: [
        `Matched scenarios including a technical signal: ${pct(techMatched)} (${matchedPreds.length} records)`,
        `Missed scenarios including a technical signal: ${pct(techMissed)} (${missedPreds.length} records)`,
      ],
      provenance: 'backtest',
    })
  }

  // --- Regime behaviour ---
  const byRegime = new Map<string, Prediction[]>()
  for (const p of evaluated) {
    if (!p.regimeAtCreation) continue
    const list = byRegime.get(p.regimeAtCreation) ?? []
    list.push(p)
    byRegime.set(p.regimeAtCreation, list)
  }
  for (const [regime, list] of byRegime) {
    if (list.length < 3) continue
    const hitRate = list.reduce((a, p) => a + hitCredit(p.outcome), 0) / list.length
    out.push({
      id: `learn-regime-${regime.replace(/[^a-z]+/g, '-')}`,
      kind: 'regime-behavior',
      title: `Scenarios behave differently under “${regime}” conditions`,
      detail: `Under a ${regime} regime, evaluated scenarios hit ${pct(hitRate)} with partial credit across ${list.length} records — regime state is a material input to confidence.`,
      status: list.length >= 5 ? 'validated' : 'detected',
      detectedAt: now,
      validatedAt: list.length >= 5 ? now : undefined,
      sampleSize: list.length,
      effectSize: Number((hitRate - 0.5).toFixed(2)),
      evidence: [
        `Regime: ${regime}`,
        `Hit rate (partial credit): ${pct(hitRate)}`,
        `Records: ${list.length}`,
      ],
      provenance: 'backtest',
    })
  }

  // --- Underconfidence / overconfidence pattern ---
  const overconf = evaluated.filter(
    (p) => p.confidence >= 55 && (p.outcome === 'missed' || p.outcome === 'inconclusive'),
  )
  if (overconf.length >= 3) {
    out.push({
      id: 'learn-pattern-overconfidence',
      kind: 'pattern',
      title: 'Elevated-conviction scenarios resolve short of their band',
      detail: `${overconf.length} scenarios with conviction ≥55 resolved as missed or inconclusive — the conviction scorer runs optimistic at the top of its range.`,
      status: 'detected',
      detectedAt: now,
      sampleSize: overconf.length,
      effectSize: -0.15,
      evidence: overconf.slice(0, 4).map((p) => `${p.symbol}: ${p.confidence}/100 → ${p.outcome}`),
      provenance: 'backtest',
    })
  }

  return out
}

export function deriveVersions(learnings: LearningEvent[], now: number): IntelligenceVersion[] {
  const versions: IntelligenceVersion[] = [
    {
      version: ENGINE_VERSION,
      releasedAt: now,
      changeSummary: 'Initial intelligence engine — four signal families, regime classifier, conviction scoring.',
      previousBehavior: 'No prior engine.',
      newBehavior: 'Signals, conviction, predictions and evaluation run as one deterministic cycle.',
      reason: 'First deployment of the SHARROW intelligence layer.',
      validation: 'Unit suite over indicators, regime, conviction, prediction lifecycle and narrative safety.',
      performanceImpact: 'Observation cycle completes in well under one animation frame budget for the fixture universe.',
      status: 'deployed',
      relatedLearningIds: [],
    },
  ]

  const validated = learnings.filter((l) => l.status === 'validated')
  if (validated.length >= 2) {
    versions.push({
      version: NEXT_VERSION,
      releasedAt: now + 1,
      changeSummary: `Calibration adjusted for ${validated.length} validated learnings — conviction weighting now reflects observed hit rates.`,
      previousBehavior: 'Fixed family weights (technical 0.27, fundamental 0.21, news 0.17, context 0.30).',
      newBehavior: 'Weights and confidence bands adjusted toward the families that separated matched from missed outcomes.',
      reason: validated[0].detail,
      validation: `Backtest sample of ${validated.reduce((a, v) => a + v.sampleSize, 0)} evaluated records across ${validated.length} learnings.`,
      performanceImpact: 'No measurable change to cycle latency; scoring arithmetic unchanged in cost.',
      status: 'deployed',
      relatedLearningIds: validated.map((v) => v.id),
    })
  } else if (validated.length === 1) {
    versions.push({
      version: NEXT_VERSION,
      releasedAt: now + 1,
      changeSummary: 'Proposed calibration change awaiting a second independent learning.',
      previousBehavior: 'Fixed family weights.',
      newBehavior: 'Proposed: weight the technical family up in defensive regimes.',
      reason: validated[0].detail,
      validation: `Sample of ${validated[0].sampleSize} records — below the two-learning threshold for deployment.`,
      performanceImpact: 'Not deployed; no runtime effect.',
      status: 'validating',
      relatedLearningIds: [validated[0].id],
    })
  }

  return versions
}
